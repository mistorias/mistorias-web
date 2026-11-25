# ADR 0036: Los comentarios públicos de los lectores llegan por PR, sin JavaScript

## Estado

Aceptado. Amplía el [ADR 0029](0029-formularios-de-feedback-con-netlify-forms.md)
(los formularios de feedback) y el [ADR 0032](0032-registro-de-difusion-en-la-carpeta-de-la-historia.md)
(lo que admite la carpeta de una historia): la allow list del gate de carpetas
deja de ser solo de nombres literales y suma un patrón.

## Contexto

El [issue #31 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/31)
pide que las voces de los lectores se vean bajo cada historia. Lo que se
decidió, y que condiciona todo lo demás:

- **Necesidad.** Que el comentario aparezca con demora está bien: no se busca
  una conversación en vivo.
- **Moderación humana previa.** Nada se muestra sin que una persona del equipo
  lo apruebe.
- **Un solo formulario.** `OpinionHistoria` ya recoge la calificación y un
  comentario privado. Elegir entre **anónimo** (no se publica) y **público con
  nombre** es una pregunta más en ese mismo formulario, no un formulario nuevo.
- **Restricciones del sitio.** Sin JavaScript (`script-src 'none'`), sin
  servidores propios y gratis ([ADR 0002](0002-astro-como-framework.md)).

## Opciones evaluadas

| Opción | Por qué se descartó |
| --- | --- |
| Widget de terceros en un `iframe` (Disqus, Commento, etc.) | Exige relajar la CSP (`frame-src`, y casi siempre `script-src`), carga rastreadores en la lectura de una historia y deja el contenido fuera de git, sin auditoría |
| Staticman u otro servicio que abre PR | Es un servicio de terceros que recibe el texto y la clave de escritura al repositorio; los públicos están sin mantenimiento |
| Comentar en redes sociales | El comentario vive en otra plataforma, no se puede mostrar bajo la historia sin APIs ni tokens por red, y no es del lector ni nuestro |
| GitHub Discussions | Obliga al lector a tener cuenta de GitHub y sale del sitio |
| Correo | Hay que leerlo, copiarlo y pegarlo a mano; no escala ni deja rastro auditable |
| Publicación inmediata, sin moderar | Un comentario con enlaces de spam o con una firma falsa quedaría visible bajo una historia sin que nadie lo vea antes |
| Verificar al lector por correo | Pide un dato personal más (Ley 29733) y exige enviar correos desde un servidor propio |
| Pre-moderación en un repositorio privado | Ocultaría el comentario hasta fusionarlo, pero obliga a un segundo repositorio y a sincronizarlo; no hay motivo para esconder lo que el lector pidió publicar |

## Decisión

**Cada comentario público se abre como un PR en mistorias-contenido, que es
público.** Fusionar el PR es aprobar el comentario; cerrarlo, rechazarlo. Lo
demás (publicarlo en el sitio) sigue el camino que ya existe: el PR diario del
submódulo y el siguiente tag.

```
Lector → POST HTML (sin cambios en la CSP)
  → Netlify Forms verifica (honeypot + Akismet) → el envío queda en el panel, privado
  → función formSubmitted
      ├─ otro formulario / anónimo / inválido / regla de contenido / cola llena → no hace nada
      └─ público y válido → PR en mistorias-contenido con stories/<slug>/comentario-<id>.json
  → fusionar = aprobar · cerrar = rechazar → PR diario actualizar-contenido → próximo tag
```

### Un archivo por comentario

`stories/<slug>/comentario-<id>.json`, con `id` = los primeros 16 caracteres
hexadecimales del sha256 de historia + nombre + texto.

- **Sin conflictos.** Dos comentarios a la misma historia tocan archivos
  distintos, así que ningún PR bloquea a otro al fusionar. Un solo archivo por
  historia (`comentarios.json`) se conflictuaría cada vez.
- **Idempotente.** El id es determinista: un doble envío produce el mismo
  nombre de rama y la API de GitHub responde 422, que la función registra como
  duplicado sin abrir un segundo PR.
- **Aprobar = fusionar.** Un archivo nuevo no se confunde con una edición de
  otro; rechazar es cerrar sin tocar nada.

### El gate admite un patrón

El gate de carpetas ([ADR 0005](0005-imagenes-en-historias.md),
[ADR 0032](0032-registro-de-difusion-en-la-carpeta-de-la-historia.md)) admitía
solo `principal.jpg` y `difusion.json`. Ahora admite además
`comentario-<16 hex>.json`, validado con un esquema estricto
(`src/lib/content/story-comment.ts`) que comprueba que la historia del archivo
sea la de su carpeta y que el id sea el de su nombre. El patrón es exacto
(minúsculas, 16 hex, `.json`): `Comentario-…`, `.yml` o un id corto siguen
rechazados. Es el mismo razonamiento del ADR 0032: la carpeta sigue admitiendo
solo archivos con forma conocida, y un archivo de más no entra sin pasar por el
esquema. El mismo esquema lo usarán la colección que muestra los comentarios y
la función que los escribe, para que no puedan desviarse entre sí.

### Antiabuso: solo la base

Honeypot y Akismet (los de Netlify Forms, antes de que la función se entere),
un tope de la cola y reglas de contenido. Sin correo ni CAPTCHA: el CAPTCHA
necesita JavaScript y Netlify Forms no limita por IP.

- **Tope de la cola.** Si hay `MAX_OPEN_COMMENT_PULL_REQUESTS` (15) PRs abiertos
  de comentarios, la función no abre otro. El daño máximo de un ataque queda en
  15 PRs; el resto sigue en el panel privado de Netlify, de donde se puede
  recuperar.
- **Reglas de contenido.** Sin enlaces ni correos, sin nombres que suplanten al
  equipo (`mistorias`, `moderador`, `admin`, `equipo`…), sin caracteres de
  control ni de dirección de texto, y con límites de largo. Un comentario que
  las incumple queda como opinión privada: nunca se pierde.
- **Mostrar con cuidado.** El texto se escapa siempre; nunca se renderiza como
  Markdown ni se convierte en enlace.

### Riesgo aceptado: el PR es público

El texto sin moderar es visible en GitHub desde que se abre el PR, y un PR no
se puede borrar, solo cerrar. Se acepta de forma explícita y el formulario lo
dice antes de enviar. Elegir «público» es el consentimiento expreso que pide la
Ley 29733; no se pide correo. Quien quiera retirar su comentario después escribe
desde «Reportar un problema». Para que el PR sea seguro de leer, la función lo
arma con un título fijo y el texto dentro de una cerca de código más larga que
cualquier secuencia de backticks del texto: así no se renderizan Markdown ni
HTML, no se cargan imágenes de rastreo y las `@menciones` no notifican a nadie.

### Una GitHub App propia, acotada

La función se autentica como una GitHub App «Mistorias comentarios», instalada
solo en mistorias-contenido, con Contents RW, Pull requests RW y Metadata R, y
sin webhook. Pide en cada envío un token de instalación que dura una hora y se
acota a ese repositorio. El repositorio y la rama de destino están fijos en el
código, y ningún dato del usuario llega a rutas, ramas ni logs.

## Orden de fusión

Este cambio va **antes** del primer `comentario-*.json` en mistorias-contenido:
sin el gate nuevo, el build rechazaría la carpeta de la historia. A su vez, el
formulario que ofrece publicar solo se fusiona **después** de la función que lo
atiende; si no, ofrecería publicar sin que nadie lo haga.

## Consecuencias

- La allow list del gate ya no es solo de literales; un cambio futuro a ella se
  revisa junto con `story-comment.ts`.
- Nada de esto agrega JavaScript al sitio ni relaja la CSP.
- Moderar es una tarea diaria de la persona que edita, en GitHub, con el flujo
  de PR que ya conoce. Si el volumen la desbordara, el tope de la cola protege
  los comentarios y habría que reabrir esta decisión.
- Se necesita activar «Automatically delete head branches» en
  mistorias-contenido para que las ramas `comentarios/*` no se acumulen.
