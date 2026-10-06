# ADR 0022: Enlaces externos en pestaña nueva, con aviso

## Estado

Aceptado

## Contexto

Al agregar las redes al pie ([ADR 0021](0021-seguir-en-redes-desde-el-pie.md), issue
#148) apareció una pregunta que el sitio no había resuelto: qué pasa con un enlace
que lleva fuera de Mistorias.

Si abre en la misma pestaña, quien lee una historia, toca un enlace externo y quiere
volver tiene que retroceder por el historial y a veces pierde su lugar. Si abre en
una pestaña nueva sin avisar, es una sorpresa que desorienta, sobre todo con lector
de pantalla o lupa (WCAG G201 pide avisar con antelación).

Hoy hay unos diez enlaces externos escritos a mano, sin criterio común: la mayoría
abre en la misma pestaña y el perfil de autoría abre en una nueva sin aviso.

## Decisión

**Todo enlace externo abre en pestaña nueva y lo avisa de tres maneras.** Lo hace el
componente `src/components/EnlaceExterno.astro`; un enlace externo no se escribe a
mano.

1. **Lector de pantalla.** Un `.sr-only` al final del enlace: «(se abre en una
   pestaña nueva)». Es la forma que no depende de la vista.
2. **Flecha visible.** El símbolo habitual de enlace externo, en `currentColor`,
   oculto al lector de pantalla (`aria-hidden`) para no leerlo dos veces. En
   `variante="texto"` va a continuación del texto; en `variante="icono"` va como
   insignia en la esquina, porque dentro de un ícono de 44px estorbaría al dibujo.
3. **Aviso al pasar el puntero.** «Se abre en una pestaña nueva» aparece al
   instante, sin demora y sin JavaScript. Es un elemento real y no `::after` con
   `attr()`, porque el contenido generado se expone a los lectores de pantalla y
   repetiría el aviso del punto 1; por eso lleva `aria-hidden`.
   - Solo con `@media (hover: hover)`: en táctil no hay "encima" y el aviso
     quedaría pegado tras el toque.
   - Aparece con `display: none → block`, no con `opacity`: oculto no ocupa lugar
     ni agranda el área desplazable de la página.
   - Usa `--color-fondo` sobre `--color-texto`, que se invierten solos en modo
     oscuro (14.4:1 en ambos temas). No hay tokens nuevos.

Además, el `rel` siempre incluye `noopener noreferrer`. `noopener` impide que la
página destino controle la nuestra; `noreferrer` evita enviarle de qué página de
Mistorias viene quien llega. Quien use el componente puede sumar valores
(`rel="me"` en las redes), pero no quitar estos.

### Un solo componente, no un atributo

Se probó la alternativa de una regla CSS sobre `a[href^="http"]`. Se descartó: no
puede abrir la pestaña ni agregar el texto para lector de pantalla, y haría que el
aviso dependiera de que nadie escriba el `href` de otra forma. El componente, en
cambio, es el único lugar que cambia si el estándar cambia.

### Cómo se acomoda el aviso

El aviso es angosto a propósito (hasta `7.5rem`, dos líneas). Con una sola línea
(~`12rem`), centrado sobre un ícono de 44px junto al borde derecho de la página, se
salía de la pantalla y creaba scroll horizontal a 844px. Aun así, un enlace pegado
al borde derecho puede necesitar `avisoAlineado="fin"`, que ancla el aviso a su
borde final en vez de centrarlo; las redes lo usan en el último ícono.

## Consecuencias

- Quien lee no pierde su lugar en la historia al seguir un enlace externo.
- Los enlaces externos de las páginas (`contenido`, `reportar`, `codigo`, `marca`,
  `DatoConFuente`, `NotaDeFuente` y el perfil de autoría) pasan por el componente.
  `tests/enlaces-externos-de-paginas.spec.ts` falla si `contenido`, `reportar`,
  `codigo` o `marca` vuelven a escribir un `<a href="https://…">` a mano, y los tests
  de `DatoConFuente` y `NotaDeFuente` cubren los suyos. El perfil de autoría depende
  de la colección de autores y no se renderiza en tests: queda sin red.
- Los enlaces dentro del texto de las historias (Markdown) tampoco pasan por el
  componente, y como el sitio rechaza HTML en ellas no pueden usarlo. Aplicarles el
  estándar requiere un plugin de rehype en `astro.config.mjs` que genere el mismo
  marcado; queda pendiente, y esa duplicación del marcado se cubrirá con un test.
- **Límite conocido: el aviso no se puede descartar con Escape** (WCAG 1.4.13),
  porque eso exige JavaScript y la CSP es `script-src 'none'`. Se asume porque el
  aviso solo repite lo que el lector de pantalla y la flecha ya comunican, no es
  información exclusiva, y desaparece al mover el puntero.
- Dentro del panel de fuente de `DatoConFuente` el aviso del puntero no se muestra:
  el panel se desplaza (`overflow-y: auto`) y lo recortaría. Ahí quedan la flecha y
  el texto para lector de pantalla.
- El aviso no se muestra al enfocar con teclado: la flecha y el texto para lector
  de pantalla ya cubren a esa persona.
