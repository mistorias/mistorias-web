# ADR 0026: El índice de temas se dibuja como un quipu por letra

## Estado

Aceptado

## Contexto

El [issue #182](https://github.com/mistorias/mistorias-web/issues/182) observa
que `/temas/` mostraba todos los temas en una sola grilla, ordenada de más a
menos historias, y que el lector se pierde buscando uno. Pide agrupar por la
primera letra del tema, con un estilo parecido al de `/historias/`, que desde
la [ADR 0020](0020-navegacion-cronologica-como-quipu.md) se dibuja como un
quipu.

## Decisión

### 1. El mismo quipu, contando otra cosa

Una letra con su tema se parece más a una semana con sus historias que a una
lista con viñetas. Por eso se usa el mismo instrumento y no solo su
encabezado:

| Quipu de historias | Quipu de temas |
| --- | --- |
| Cuerda principal: un año (`2026 · 13 historias`) | Cuerda principal: una letra (`A · 6 temas`) |
| Fila: una semana | Fila: un tema |
| N nudos = historias de esa semana | N nudos = historias de ese tema |

Igual que en la ADR 0020, la forma *es* el dato: un tema muy tocado se ve más
anudado sin leer el número. Se descartó dejar solo el encabezado (letra y
greca) sobre la grilla anterior porque la página quedaba visualmente ajena a
`/historias/`.

Para no duplicar piezas, el `summary` con la greca pasa a
`ResumenDeQuipu.astro`, y `NudoDeQuipu` gana `reparto="parejo"`. La fila de un
tema no tiene rótulo encima, así que sus nudos no reservan espacio para
encabezado y quedan centrados en su tramo.

### 2. Orden alfabético por letra

`groupByInitial` (`src/lib/themes.ts`) agrupa por la inicial sin tilde
("ética" va en la E), pero conserva la Ñ como letra propia, después de la N.
Lo que no empieza con letra va bajo `#`, al final. Dentro de cada letra, los
temas van en orden alfabético: en un índice para buscar, el orden por cantidad
desorienta. `groupByTheme` mantiene su orden por cantidad porque lo siguen
usando otras lecturas.

### 3. Todas las letras abiertas al cargar

Cada letra es un `<details>` que se pliega, igual que un año. A diferencia de
los años, las letras arrancan todas abiertas. Cada letra tiene un ancla
(`#letra-x`, de `initialAnchor`), y un enlace a ella lleva al `summary`, pero
no abre un `<details>` cerrado: con las letras cerradas, quien salta desde
el índice de letras (§6) o llega por un enlace compartido quedaría frente a
una caja vacía.

### 4. El pliegue se anima sin JavaScript, como mejora progresiva

`interpolate-size: allow-keywords` y una transición de `block-size` sobre
`::details-content` animan la apertura y el cierre. Se aplican dos lecciones
que ya documentaba `DatoConFuente`:

- **El cierre lo maneja `visibility`, no `content-visibility`.** Animar
  `content-visibility` con `allow-discrete` no sostiene el cierre. Por eso
  queda fijo en `visible`, y lo que saca a los temas del Tab y del lector de
  pantalla es `visibility`, con la demora clásica al cerrar.
- **La duración se apaga con su propia consulta.** La regla global de
  `prefers-reduced-motion` no alcanza a `::details-content`, así que la
  duración se apaga en un `@media` propio del componente.

Donde no existe `interpolate-size`, la letra pliega igual, solo que de golpe.
Lo esencial (leer, plegar, saltar) no depende de esa función.

### 5. "Los más tocados" en vez de dos órdenes en la misma página

El orden alfabético hace que se pierda la lectura de qué temas se tratan más,
y hay lectores que la buscan. Sin JavaScript, la página podría ofrecer los dos
órdenes con un interruptor de CSS (`radio` + `:has()`), pero ese es el patrón
más frágil. Una opción es duplicar la lista. La otra es reordenarla solo a la
vista, y entonces el orden del Tab ya no coincide con el que se ve. En ninguno
de los dos casos el estado queda en la URL. Por eso, arriba del quipu va una
lista corta con los 3 temas con más historias (`mostCoveredThemes`). Si hay 3
temas o menos, la lista no aparece: solo repetiría el quipu.

### 6. Índice de letras: al pie en móvil, a la derecha en escritorio

`IndiceDeLetras.astro` envuelve al quipu y agrega `<nav aria-label="Saltar a
una letra">` con un enlace por letra presente (`#letra-x`).

- **Disposición.** Si la columna de temas mide menos de 30rem, el índice es
  una sola fila `sticky` pegada al pie de la pantalla, en la zona del pulgar,
  que se desliza con el dedo. Si mide más, es una columna `sticky` a la
  derecha, que se desliza por su cuenta cuando no entra a lo alto (celular
  horizontal). Lo que decide es el ancho de la columna y no el de la
  pantalla, así que se usa una container query. Está permitida por la misma
  razón que en el pie (ADR 0021): adentro no hay nada `position: fixed`.
- **Accesibilidad.** El índice va después del quipu en el HTML, así que el
  lector de pantalla oye primero los temas. No se oculta con `aria-hidden`,
  porque sus enlaces reciben foco y un foco que no se anuncia es una falla.
  La barra no tapa el elemento con foco (WCAG 2.4.11): un
  `scroll-padding-block-end` en `html` del alto de la barra hace que el
  navegador deje lo enfocado por encima.
- **Pista de "hay más letras".** Un degradado en el borde final de la fila
  desaparece al llegar al final. Usa scroll-driven animations y es mejora
  progresiva: sin ellas la fila se desliza igual. La línea de tiempo va en una
  regla aparte porque el minificador la metía en el atajo `animation`, que no
  la admite, y se perdía la animación entera.

## Consecuencias

- `/temas/` ya no ordena por cantidad. Esa lectura queda en "Los más tocados"
  y en los nudos.
- El quipu de temas y el de historias comparten `ResumenDeQuipu` y
  `NudoDeQuipu`. Un cambio en esas piezas se revisa en las dos páginas.
- La animación es una mejora progresiva. Qué navegadores soporta el sitio y
  con qué criterio queda para una política aparte.
