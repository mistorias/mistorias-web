# ADR 0015: La tarjeta de historia tiene un solo enlace, estirado sobre toda la tarjeta

## Estado

Aceptado

## Contexto

En `TarjetaHistoria.astro` el único elemento clicable era el título
(`<a class="tarjeta__enlace">{title}</a>`). La imagen, el resumen y el resto
de la tarjeta no llevaban a ningún lado, aunque visualmente invitan a hacer
clic — issue #41 pide que la imagen también navegue a la historia, con cursor
de enlace en escritorio, y de paso pregunta algo más de fondo: ¿hace falta que
la imagen "sea" un enlace para quien usa lector de pantalla, o conviene mover
esa responsabilidad a un enlace explícito al final de la tarjeta?

La respuesta obvia — envolver también la imagen en un `<a>` al mismo destino —
tiene un costo de accesibilidad real: quien navega por lista de enlaces (una
forma común de recorrer una página con lector de pantalla) se encontraría dos
enlaces seguidos al mismo lugar por cada tarjeta, sin diferencia útil entre
ellos. El propio issue lo anticipa y sugiere evitarlo.

## Decisión

### Un único `<a>` real por tarjeta, estirado con CSS

Se agrega un enlace nuevo al final de la tarjeta ("Leer la historia
completa: {título}", con el título en un `.sr-only` para no repetirlo visible
en cada tarjeta de una grilla) y **se quita el `<a>` del título**, que pasa a
ser texto plano dentro del mismo `<h2>`/`<h3>` de siempre.

Ese único enlace se estira sobre toda la tarjeta con la técnica de
"stretched link", pura CSS y compatible con `script-src 'none'`:

```css
.tarjeta { position: relative; }
.tarjeta__enlace { position: relative; }
.tarjeta__enlace::after {
    content: "";
    position: absolute;
    inset: 0;
}
```

Con esto, un clic en la imagen, el título o el resumen navega igual, sin que
ninguno de ellos sea un enlace por sí mismo — y sin duplicar nada para quien
usa lector de pantalla: hay un solo enlace en el árbol de accesibilidad de la
tarjeta.

El cursor de enlace en la imagen (pedido explícito del issue) sale gratis: es
el comportamiento nativo de un `<a>` sobre el que se está posicionado el
puntero, sin CSS adicional.

### El foco de teclado se dibuja sobre el `::after`, no sobre el texto

Con el enlace real reducido a un texto corto al final, el contorno de
`:focus-visible` por defecto (regla global de `base.css`) quedaría sobre esa
línea diminuta — no sobre la tarjeta que en la práctica se activa. Se suprime
ese contorno y se redibuja sobre el `::after` (que mide lo mismo que la
tarjeta), reusando los mismos tokens de foco (`--grosor-foco`, `--color-vivo`,
`--radio`) que ya usa la regla global — ningún token nuevo.

### Los enlaces anidados necesitan `z-index`

`ListaTemas.astro` (las fichas de tema) vive dentro de la tarjeta y son
enlaces reales a otro destino. Sin ajuste, el `::after` estirado del enlace
principal queda por encima en la pila de pintado y las fichas se vuelven
inclicables — el problema clásico de "enlaces anidados" de cualquier tarjeta
con stretched-link. Se resuelve con `position: relative; z-index: 1;` en
`.temas__ficha`, dentro del propio `ListaTemas.astro`: cualquier otro
elemento interactivo que se agregue dentro de una tarjeta con enlace estirado
necesita el mismo tratamiento.

### La sombra/brillo de la imagen reusa `--color-acento`, sin token nuevo

El issue pide una señal visual de interactividad en la imagen: sombra difusa
en modo claro, brillo en modo oscuro, sin desplazamiento y con difuso y
dispersión largos. Se implementa como `box-shadow` en `.tarjeta__imagen`,
disparada junto con el hover y el foco del enlace de la tarjeta (para reforzar
—junto con el cursor— que la tarjeta es interactiva, no como decoración
permanente):

```css
box-shadow: 0 0 3rem 1.25rem
    color-mix(in srgb, var(--color-acento) 50%, transparent);
```

`--color-acento` ya cambia de un rojo oscuro (`#8b0f0f`) en modo claro a un
durazno claro (`#f08c7f`) en modo oscuro. Sobre `--color-superficie`, ese
mismo color de sombra se lee como sombra en claro (más oscuro que la
superficie) y como brillo en oscuro (más claro que la superficie) sin
necesidad de una segunda regla ni de tocar las variables de modo oscuro —
cumple la restricción de `CLAUDE.md` de que el modo oscuro no pida cambios de
hoja de estilos por componente.

## Consecuencias

- El título de la tarjeta deja de ser un enlace. Sigue siendo un encabezado
  real (`h2`/`h3` según `nivelTitulo`), así que la navegación por encabezados
  de un lector de pantalla no cambia; solo cambia la navegación por enlaces,
  que ahora ofrece un enlace por tarjeta en vez de uno redundante por parte.
- Cualquier elemento interactivo nuevo que se agregue dentro de `.tarjeta`
  (además de `ListaTemas`) necesita el mismo `position: relative; z-index: 1`
  para no quedar tapado por el enlace estirado.
- Las convenciones generales de cómo escribir enlaces (no solo las de esta
  tarjeta) quedan documentadas en [docs/ENLACES.md](../ENLACES.md), para no
  repetir esta discusión en el próximo componente que necesite un enlace.
- El comportamiento de hover/focus (la sombra, el cursor) no se puede probar
  con la Container API de Astro (limitación ya documentada en `CLAUDE.md`);
  las pruebas cubren que hay un único `tarjeta__enlace` con el `href` y el
  texto accesible correctos, y que el título ya no está envuelto en `<a>`. El
  resto se verifica en navegador, en claro y oscuro.
