# ADR 0010: La portada abre con datos verificables

## Estado

Aceptado

## Contexto

La portada abría con el título del sitio y, debajo, la promesa: «Detrás de cada
cifra sobre educación hay una persona con nombre…». Quien llegaba por primera
vez no tenía ninguna razón para creer que el asunto le concierne: la promesa se
enunciaba sin haber generado antes ninguna tensión.

El [issue #37 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/37)
pide anteponerle una entrada basada en datos duros, con tres condiciones: que
los datos sean reales y actuales, que quien lee pueda **verificarlos mediante
un enlace**, y que el golpe llegue en unos tres segundos.

La tercera condición choca con la segunda. Dos enlaces de fuente escritos dentro
del texto lo ensucian y le quitan el filo justo a la frase que tiene que golpear;
esconderlos del todo traiciona el principio de transparencia de la marca
(«cada fuente se enlaza, se dice qué es»). Hay que mostrarlos, pero a pedido.

Restricción que decide casi todo lo demás: **`script-src 'none'`**
([ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)). El sitio no envía
JavaScript, así que el mecanismo de «a pedido» tiene que ser HTML y CSS.

## Decisión

### 1. El orden es entrada → promesa

`src/pages/index.astro` abre con dos cifras que incomodan, seguidas —como parte
del mismo párrafo corrido— de la frase que las vuelve personales («es el país
que mañana te atenderá»), y recién ahí promete. Las dos primeras frases y la
tercera comparten la misma clase, `.portada__entrada`, y por lo tanto el mismo
tratamiento tipográfico: es una sola entrada, no dos bloques enfrentados.

| Bloque | Tamaño | Color |
|---|---|---|
| `h1` | `--paso-3` | `--color-texto` |
| Entrada (`.portada__entrada`, tres frases) | `--paso-1` | `--color-texto`, cifras en `--color-acento` |
| Promesa (`.portada__promesa`) | `--paso-0` | `--color-texto`, los tres verbos en `--color-analitico` |

El `h1` **no** cede su tamaño. Es lo que nombra al sitio y lo que sostiene el
SEO; la entrada baja debajo y a menor escala, y aun así golpea porque es lo
único con color de acento en toda la franja. Se resaltan dos cosas y nada más:
las dos cifras, y los tres verbos de la secuencia de marca SIENTE → ENTIENDE →
ACTÚA (`adéntrate`, `entiende`, `convierte`). Resaltar más sería no resaltar.

La promesa se separa de la entrada solo con `--esp-xl`: no hay línea ni
adorno entre ambas. La entrada es una transición hacia la promesa, no un bloque
contrapuesto a ella, así que no necesita marcar el cambio de tono con una regla
visual — el salto de tamaño y el `--esp-xl` ya lo hacen.

### 2. Cada afirmación es un `<details>` nativo, no un componente con estado

`src/components/DatoConFuente.astro` envuelve la afirmación en
`details > summary + p`: el `summary` es la frase completa y el `p` que le sigue
trae el enlace a la fuente y el dato que permite comprobarla. Tanto el `details`
como el `summary` son `display: inline`, así que varios `DatoConFuente`
seguidos se leen como un solo párrafo en vez de como una lista de bloques.

El navegador ya sabe hacer todo lo que esto necesita: abrir y cerrar, anunciarlo
como plegable con su `aria-expanded`, y responder a Enter y a Espacio. No hace
falta un solo byte de JavaScript, que además la CSP no permitiría.

El atributo `name` compartido convierte a las dos afirmaciones en un acordeón
exclusivo: abrir una cierra la otra, y nunca hay dos fuentes desplegadas
compitiendo por la atención.

### 3. En escritorio abre el chip «fuente»; en táctil, la frase entera

La marca visual de que hay algo que abrir es un chip pequeño con la palabra
«fuente», detrás de la frase. Está `aria-hidden` porque el `summary` ya se
anuncia como plegable: para quien usa lector de pantalla, repetirlo sería ruido.

```css
@media (hover: hover) {
  .dato:has(.dato__pista:hover)::details-content { content-visibility: visible; }
}
```

El disparador del hover es **el chip y no la frase**. Si bastara con pasar por
encima del texto, la fuente se abriría sola mientras se lee y la barra
parpadearía al cruzar cada frase; apuntar al chip es una intención, no un
accidente. La consulta `hover: hover` es la misma que ya usa `base.css`: en
táctil un hover se queda pegado después del toque. Ahí manda el toque sobre la
frase completa, que es un blanco mucho más grande, y el segundo toque la
cierra.

Donde `::details-content` no exista, la regla no aplica y la fuente se sigue
abriendo con clic, con toque o con Enter. Se pierde una comodidad, nunca el
acceso al dato.

### 4. La fuente va fija al fondo de la ventana

Se probaron tres posiciones, en este orden:

1. **Flotante, pegada a la frase** (`position: absolute` junto al `summary`).
   Quedaba encima de la frase siguiente: le tapaba el texto y le interceptaba
   los toques, así que el segundo dato dejaba de poder abrirse. Descartada.
2. **En el flujo**, empujando lo que sigue — lo que hace cualquier plegable por
   defecto. Con las dos frases como párrafo corrido, abrir una fuente partía el
   párrafo en dos: el resto de la portada saltaba de lugar cada vez. Descartada.
3. **Fija al fondo de la ventana** (`position: fixed`, `inset-inline: 0`,
   `inset-block-end: 0`). No empuja nada porque no está en el flujo, y no tapa
   ninguna frase porque no se superpone al texto: aparece por debajo de todo el
   contenido. Es la que queda.

```css
.dato__fuente {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 5;
  max-height: 40dvh;
  overflow-y: auto;
}
```

`z-index: 5` la mantiene por encima del contenido de la página, que de otro
modo la taparía al pintarse después en el DOM. Cuando se escribió este ADR el
motivo concreto era `SiluetaSalon`, el otro `position: fixed` del sitio; esa
silueta se retiró en [ADR 0012](0012-ilustracion-de-portada.md), pero el
`z-index` sigue haciendo falta. Queda por debajo de `.salto-contenido`
(`z-index: 10`), que debe seguir ganando el foco de teclado.

Que la barra sea `fixed` respecto de la **ventana** no es un detalle: cualquier
antepasado suyo con `contain: layout` —lo que aplica, entre otras cosas,
`container-type`— pasa a ser su bloque contenedor y la desancla. [ADR
0012](0012-ilustracion-de-portada.md) documenta el caso concreto en que eso
apareció. `max-height: 40dvh` con `overflow-y: auto` es el seguro para
celular horizontal (~390px de alto): sin él la barra puede comerse media
pantalla; con él, el texto se desplaza dentro de la barra si no entra.

La barra entra y sale con una transición lineal y corta (0.3s en táctil, 0.1s
con puntero, apagada con `prefers-reduced-motion: reduce`), para que el cambio
se note pero no distraiga. La duración vive en una variable propia del
componente porque el apagado global de `base.css` no alcanza a
`::details-content`.

**Limitación conocida, aceptada a sabiendas:** sin JavaScript, un `details`
solo lo cierra su propio `summary`. Si el lector abre una fuente y se desplaza
página abajo, la barra se queda fija hasta que vuelve a esa frase y la cierra,
abre la otra fuente (el acordeón exclusivo la cierra por él), o —con
puntero— saca el mouse del chip. No hay forma de cerrarla desde otro punto de
la página sin recurrir a JavaScript, y eso rompería `script-src 'none'`
(ADR 0004).

## Consecuencias

- La portada es más larga: la historia destacada baja. Es el precio de que la
  promesa llegue después de una razón para escucharla.
- **Punto de mantenimiento**: las dos cifras son de PISA 2022 y están fijas en
  el texto. Cuando la OCDE publique el siguiente ciclo hay que revisarlas en
  `index.astro`, donde la constante `CICLO_DE_LOS_DATOS` deja esa dependencia a
  la vista. El propio issue lo asume como el precio de usar datos duros.
- `DatoConFuente.astro` sirve para cualquier afirmación con dato duro, no solo
  para la portada.
- El hover, el toque y la posición fija no se pueden probar con la Container
  API, que renderiza en Node: `tests/dato-con-fuente.spec.ts` cubre la
  estructura del marcado y el comportamiento se verificó en Chromium, en tema
  claro, con puntero y con toque, y con teclado.
