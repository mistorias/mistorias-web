# ADR 0012: La ilustración de portada va en el flujo, en línea y a dos tintas

## Estado

Aceptado

## Contexto

La portada era solo texto: título, dos cifras de PISA con su fuente
([ADR 0010](0010-apertura-de-portada-con-datos-verificables.md)) y la promesa,
todo dentro de una columna de lectura de 65ch. La única pieza gráfica del sitio
era `SiluetaSalon.astro`, un dibujo decorativo anclado con `position: fixed` al
borde inferior de la ventana en todas las páginas menos el detalle de historia
([ADR 0011](0011-silueta-del-salon-en-svg.md)).

Se dispuso de una ilustración de marca —una planta cuyas flores son libros
abiertos, uno de ellos destacado en color— para acompañar la apertura. El
pedido: que vaya al costado del texto cuando hay ancho y debajo cuando no, y
que la silueta fija se retire.

## Decisión

### 1. La ilustración entra al flujo; la silueta se retira

Un dibujo `fixed` al pie de la ventana acompaña a todas las páginas sin
pertenecer a ninguna: no puede componer con el texto, y encima obliga a
reservarle espacio al final del documento para que no tape el pie
(`--alto-relleno-silueta-salon`). Una ilustración en el flujo de la portada sí
compone con el título y las cifras, y no le debe nada al resto del sitio.

Con la ilustración adentro, la silueta queda sin función. Se retira entera:
componente, SVG, prueba, los dos tokens de alto, la prop `ocultarSilueta` de
`BaseLayout` y el único lugar que la pasaba.

### 2. Se inyecta en línea con `set:html`, no como `<img>` ni como máscara

El sitio tiene tres formas de servir un dibujo, y las tres estaban sobre la
mesa:

| Forma | Qué pasa en modo oscuro |
| --- | --- |
| `<img>` por `astro:assets` | Nada: una silueta oscura se pierde sobre Deep Slate. Haría falta un segundo archivo por tema. |
| Máscara CSS desde `public/` | Se recolorea sola, pero a **una** tinta: el libro destacado se aplanaría junto con el resto. |
| SVG en línea con `set:html` | Cada trazo toma su token. Es la que se eligió. |

El archivo trae exactamente dos `<path>`, uno por color. El componente pinta
`ink-base` con `currentColor` (o sea `--color-texto`) e `ink-acento` con
`--color-analitico`. Un solo archivo sirve los dos temas y conserva el acento
del dibujo, que era lo que la máscara no podía dar.

De yapa, la proporción sale del `viewBox` en vez de declararse a mano en el
CSS. Es justo el modo de falla que ADR 0011 encontró en la silueta: un
`aspect-ratio` que no correspondía al archivo la dibujó al 55.1 % de su alto
declarado durante años sin que nada lo señalara. Acá no hay número que se
pueda desincronizar.

El costo es real y se acepta: ~9.5 KB gzip incrustados en el HTML de la portada
en vez de un archivo cacheable aparte. A cambio se van los 5.5 KB gzip de la
silueta, que cargaban en **todas** las páginas.

### 3. El archivo se preparó, no se copió

El SVG que llegó de la vectorización no era publicable tal cual. Medido antes
de tocarlo:

```
1147 × 2048   viewBox "0 0 1147 2048"   73 KB crudos / 27 KB gzip
2 <path>:  .ink-dark  #000000   x 150–995  y 298–1907   (planta, tallos, maceta)
           .ink-blue  #012C75   x 356–985  y  99– 531   (el libro de arriba)
bbox de tinta combinado: x 150–995, y 99–1907 → 845 × 1808
```

Cuatro correcciones, cada una con su motivo:

1. **El `#012C75` no existe en la paleta de marca.** El PNG del que se
   vectorizó tenía ese libro en `#5e2c3e`, que es exactamente
   `--color-analitico`; el vectorizador lo cambió. Al pintar por token el color
   vuelve a marca solo.
2. **Los colores venían en un `<style>` incrustado**, que es lo que el gate del
   símbolo prohíbe desde ADR 0007 y con razón: inyectado con `set:html` se
   vuelve una hoja de estilos real del documento. Se reemplazaron por las dos
   clases de tinta, sin color propio.
3. **El lienzo traía 13 % de margen vacío por lado** (150 px izquierda, 152
   derecha, 99 arriba, 141 abajo). Se recortó el `viewBox` a `150 99 845 1808`
   —solo el atributo del lienzo, nunca los `path`, así que el dibujo queda
   intacto por construcción—, misma operación que ADR 0011 hizo con la silueta.
   Sin el recorte, la caja del componente no mide lo que mide el dibujo y el
   centrado en pantalla angosta se ve corrido.
4. **SVGO `--multipass`** lo bajó de 73 KB a 33 KB crudos (9.5 KB gzip). SVGO
   no entra como dependencia: se corrió por `pnpm dlx` sobre un archivo que se
   comitea ya optimizado, igual que en ADR 0011.

Verificación del recorte: el bbox del vector (845 × 1808) coincide con el del
PNG original (846 × 1811) dentro de 3 px, así que la vectorización respeta la
composición y el recorte no perdió tinta.

### 4. El gate del símbolo de marca se comparte

`symbol-gate.ts` ya validaba exactamente el contrato que necesita un SVG
inyectado en línea: `viewBox` presente, sin color fijo, sin `<style>`, sin
`<script>`, sin manejadores de evento, sin `foreignObject`, sin referencias
externas. Ese contrato no es propio del símbolo: es el de cualquier SVG que
entre al documento con `set:html`. Se extrajo a
`src/lib/assets/inline-svg-gate.ts` y `symbol-gate.ts` quedó delegando.

Preparar la ilustración destapó un hueco en ese gate: solo miraba `fill=` y
`stroke=` como atributos, así que un `style="fill:#012c75"` —que es
exactamente lo que SVGO escribe al desarmar un `<style>`— pasaba sin ruido y
rompía el modo oscuro igual que el atributo. Se cerró.

`illustration-gate.ts` le suma la comprobación propia del dibujo: que las dos
clases de tinta sigan ahí. Sin ella, reexportar la ilustración desde la
herramienta de diseño —que es como llegó la primera vez, con los colores en un
`<style>`— compila sin quejarse y publica un dibujo negro sobre Deep Slate.
Corre en `astro dev` y en `astro build`, como los demás gates.

### 5. `wrap-reverse` da las dos posiciones con un solo orden de DOM

Se pide la imagen **a la izquierda** cuando hay ancho y **debajo del texto**
cuando no. Un orden de DOM fijo no da las dos: con la imagen primero queda a la
izquierda pero también arriba al apilarse.

`flex-wrap: wrap-reverse` invierte el eje transversal y no el principal. Sin
envolver, la imagen —primera del DOM— queda a la izquierda; al envolver, su
línea se dibuja abajo. Sale el comportamiento pedido sin un punto de quiebre
por ancho, que es la regla que `base.css` declara.

Tiene una trampa que conviene dejar escrita: bajo `wrap-reverse` el eje
transversal está invertido, así que `align-items: flex-start` alinea *abajo*.
Se usa `center`, que no depende de la inversión.

### 6. El tamaño es fluido, y por qué no es una consulta de contenedor

El dibujo mide `clamp(7rem, 22vw, 18rem)`: ~18rem en escritorio, bajando con el
ancho. Cuando la fila envuelve —alrededor de 710px— ya viene chico, así que
pasa abajo sin dar un salto. Los topes existen porque el dibujo es muy vertical
(proporción 0.467: 18rem de ancho son 38.5rem de alto): sin el máximo domina la
portada, y sin el mínimo desaparece en celular. Apilado se centra con
`margin-inline: auto`, que en la fila no hace nada porque el texto ya absorbe
el espacio libre.

Lo natural habría sido una `@container` sobre la fila: distinguir "al costado"
de "abajo" es exactamente para lo que existen. Se probó y se descartó por dos
motivos, los dos comprobados en navegador:

1. **Desancla la barra de fuentes.** `container-type` aplica `contain: layout`,
   y un elemento con containment de layout es bloque contenedor de sus
   descendientes `position: fixed`. La barra de `DatoConFuente` dejaba de
   anclarse a la ventana, que es el corazón de ADR 0010. Cualquier antepasado
   del texto de la portada tiene el mismo problema, así que no había dónde
   poner el contenedor.
2. **El umbral nunca coincidía con el envolvimiento.** El ancho consultado
   alimenta la decisión de envolver: achicar el dibujo lo hacía entrar de nuevo
   en la fila, así que la consulta disparaba antes que el `wrap` y el dibujo
   quedaba chico *al costado*. Medido a 820px de viewport.

Queda una media query, y corta por **altura**: el celular horizontal
(844 × 390) es ancho, así que no envuelve, y a tamaño completo el dibujo no
entra en una pantalla de 24rem de alto. Reusa el `@media (max-height: 30rem)`
que `base.css` ya tenía — la restricción real ahí es el alto, no el ancho.

## Consecuencias

- La portada pasa de `.columna` (65ch) a `.contenedor` (64rem). El texto
  conserva su medida de lectura con `max-width: var(--medida)` en su propia
  columna.
- `public/` queda sin ningún `.svg`. `public-svg-gate.ts` se mantiene: es
  genérico sobre el directorio y sus pruebas usan fixtures propios.
- El comportamiento adaptable —`wrap-reverse`, los tamaños, el mapeo de clases
  a tokens— vive en un `<style>` con ámbito que la Container API no expone en
  `renderToString` (limitación ya documentada en `CLAUDE.md`). Las pruebas
  cubren el marcado y el gate; el resto se verificó en navegador a 1280, 844,
  820, 700, 500 y 390 px, en modo claro y oscuro.
- Si en el futuro se agrega una segunda ilustración, `illustration-gate.ts`
  apunta a un archivo fijo: habría que generalizarlo a un directorio, como hace
  `public-svg-gate.ts`.
