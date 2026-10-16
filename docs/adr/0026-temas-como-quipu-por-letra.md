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
no abre un `<details>` cerrado: con las letras cerradas, quien llega por un
enlace compartido quedaría frente a una caja vacía.

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

## Consecuencias

- `/temas/` deja de mostrar de un vistazo qué temas son los más tocados. Los
  nudos lo sugieren, pero no lo ordenan.
- El quipu de temas y el de historias comparten `ResumenDeQuipu` y
  `NudoDeQuipu`. Un cambio en esas piezas se revisa en las dos páginas.
- La animación es una mejora progresiva. Qué navegadores soporta el sitio y
  con qué criterio queda para una política aparte.
