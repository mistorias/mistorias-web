# ADR 0016: La autoría de una historia es una referencia, y el uso de IA se declara por historia

## Estado

Aceptado

## Contexto

Las siete historias publicadas firmaban `author: "Equipo Mistorias"`: un string
libre que no apunta a nadie. Quien lee no tenía forma de saber que hay una
persona responsable detrás de lo que acaba de leer, ni qué parte del trabajo
hizo una inteligencia artificial. Dos problemas distintos con la misma raíz.

El primero es de confianza. «Equipo» sugiere varias personas y detrás hay una
sola: la contradicción la nota justo el lector atento, que es el que más
interesa retener, y choca con el principio de transparencia que la marca ya
predica. El segundo es de honestidad sobre el método: el sitio usa IA en su
proceso editorial y no lo decía en ninguna parte.

Hay una tercera restricción que condiciona el diseño y no es técnica. Quien
escribe hoy tiene un riesgo profesional real —un proyecto público puede leerse
como un segundo trabajo— y `mistorias-contenido` es un repositorio público cuyo
historial no se borra. Todo lo que se le pide a una persona que colabora es
permanente.

## Decisión

### 1. El autor es una referencia, no un nombre

`author` deja de ser `z.string()` y pasa a `reference("authors")`
(`src/lib/content/schema.ts`), sobre una colección nueva declarada en
`src/content.config.ts` que carga `content/mistorias-contenido/authors/*.md`.

El valor en el frontmatter es el slug del archivo de la ficha, y Astro falla el
build cuando esa ficha no existe:

```
[content] Invalid content reference: entry "…" in collection "stories"
(field: author) references "fulano-inexistente" in collection "authors",
but that entry does not exist.
```

Eso es lo que convierte «un string» en «una relación verificable», y evita el
modo de falla que este repositorio ya pagó una vez (issue #29): un build
exitoso publicando algo roto. No se escribió un gate propio porque el
`reference()` de Astro ya lo hace, y un segundo validador podría discrepar del
cargador —el mismo argumento por el que `raw-html-gate.ts` valida el texto del
archivo en vez de reparsear el frontmatter.

Consecuencia de tipos: `story.data.author` es `{ collection, id }`. El nombre
visible lo resuelven las páginas, una sola vez cada una, con
`buildAuthorNameMap` y `authorNameFor` (`src/lib/content/authors.ts`), y
`TarjetaHistoria.astro` lo recibe ya resuelto por la prop `nombreAutor`. Así la
tarjeta sigue siendo un componente puro, testeable sin levantar la capa de
contenido. `authorNameFor` **lanza** en vez de devolver el slug: mostrar
`paolo-carrasco` donde va «Paolo Carrasco» sería otra vez un build exitoso
publicando algo roto.

### 2. La declaración de IA va en la historia, no en la ficha

`authorship` es obligatorio y es un enum de tres valores:
`escrito-por-persona`, `editado-con-ia`, `escrito-con-ia`.

Va por historia porque el reparto **cambia entre historias**: la misma persona
puede escribir una entera y dirigir la siguiente. Un campo en la ficha del
autor describiría un promedio que ninguna historia cumple.

No es un porcentaje. «50/50» no le sirve a quien lee, porque no puede saber
*qué* mitad; una etiqueta de un conjunto cerrado sí le dice cómo leer el texto.
Y no es una coautoría: la IA no aparece en `author` porque no puede responder
por un dato mal citado ni tiene reputación que perder. Quien firma es quien
responde; la IA es proceso, y el proceso se declara.

Los rótulos y sus explicaciones viven en `src/lib/content/authorship.ts` porque
tienen dos consumidores que deben decir exactamente lo mismo: el pie de cada
historia (`FirmaAutoria.astro`) y la página «Acerca de». Si divergen, la
etiqueta del pie deja de significar lo que el sitio promete.

### 3. Se pide el mínimo, y se dice por qué

La ficha (`authorSchema`) tiene cuatro campos: `name`, `bio`, y el par
`link` / `linkLabel`, opcional **en conjunto** —mismo patrón que las tres claves
de imagen de una historia—. No hay campo de correo, y no lo va a haber.

El enlace de verificación apunta a un perfil que la propia persona ya mantiene
por su cuenta. Esa es la diferencia que importa: no es un dato nuevo que
Mistorias publica y después no puede retirar, es algo que ella ya publicó y
puede borrar sin pedirle permiso a nadie.

La página de autor dice la verdad sobre la permanencia —se quita del sitio, no
del historial de Git— en vez de prometer un borrado que un repositorio público
no puede cumplir. Los criterios editoriales completos están en `autoria.md` de
la esencia de marca.

### 4. La tarjeta no enlaza al autor

`TarjetaHistoria.astro` muestra el nombre como texto plano. El enlace a la ficha
vive en la página de la historia: en la línea de metadatos y en el pie
(`FirmaAutoria.astro`).

[ADR 0015](0015-tarjeta-como-enlace-unico-accesible.md) fija que la tarjeta
expone un solo `<a>` real, estirado sobre toda su superficie. Un segundo enlace
adentro obligaría a `position: relative; z-index: 1` —como ya necesita
`.temas__ficha`— y le daría al lector de pantalla dos destinos por cada historia
listada. El criterio de aceptación era «un clic desde cualquier historia hacia
quien la escribió», y la página de la historia ya lo cumple.

### 5. Las fichas pasan por el gate de HTML crudo

El cuerpo de una ficha es Markdown que el sitio renderiza igual que el de una
historia, así que sin gate la biografía sería la vía de inyección que las
historias ya tienen cerrada. `assertAuthorsHaveNoRawHtml` reusa el mismo
escáner y se registra como integración aparte
(`authors-no-raw-html-integration.ts`) en vez de sumarle una segunda carpeta a
`noRawHtml()`: cada gate recibe su propio directorio inyectable, y mezclarlos
dejaría las pruebas de historias dependiendo de que exista `authors/`.

### 6. Todavía no hay índice `/autores/`

Con una sola persona, una página que lista a una persona se ve pobre y no
resuelve nada: se llega a la ficha desde cualquier historia y desde «Acerca de».
El índice se agrega cuando exista un segundo autor. La cabecera tampoco cambia:
su navegación de un solo destino está justificada en el propio componente y en
[ADR 0007](0007-lockups-del-logo-y-alto-de-la-cabecera.md).

## Consecuencias

- Las siete historias publicadas migran a `author: "paolo-carrasco"` y reciben
  su `authorship`. El crédito de las ilustraciones pasa de «Equipo Mistorias» a
  «Mistorias» por la misma razón que la firma.
- Publicar una historia nueva ahora exige que exista la ficha de quien la firma.
  El skill `publicar-historia` de `mistorias-contenido` lo dice en su paso 4.
- El cambio toca dos repositorios a la vez: el contenido primero, el submódulo
  después. Un `pnpm build` con el submódulo viejo falla, y eso es correcto —es
  la misma referencia rota que el gate detecta.
- Quien colabore va a tener que escribir su propia ficha antes de su primera
  historia. Es fricción nueva, y es deliberada: es el momento en que se le
  explica qué se publica de ella y qué no se puede retirar después.

## Alternativas descartadas

**Dejar `author` como string y mostrar el nombre tal cual.** Cero trabajo, y
deja el problema entero: no hay ficha, no hay página, y un error de tipeo
publica una firma distinta sin que nada falle.

**Declarar el uso de IA una sola vez en «Acerca de».** Más barato, pero falso
en cuanto una historia se aparta del promedio —que es justo lo que ya pasó con
la del 31 de agosto.

**Poner a la IA como coautora en `author`.** Es lo que se sintió honesto al
principio. Rompe el objetivo: quien buscaba un responsable encuentra medio
responsable, y la mitad que no responde no se puede reclamar.

**Un seudónimo para proteger a quien escribe.** No protege: el nombre real ya
está en el historial público de Git de los dos repositorios, y un seudónimo que
se cae solo se lee como ocultamiento en un proyecto que predica transparencia.
Lo que sí protege es el descargo de independencia laboral, visible en «Acerca
de» y en la ficha.
