# ADR 0036: Lo esencial usa Baseline ampliamente disponible; lo decorativo, mejora progresiva

## Estado

Aceptado

## Contexto

No había nada escrito sobre en qué navegadores tiene que funcionar bien
Mistorias. La pregunta salió con el índice de temas (#182, ADR 0026), que usa
funciones recientes de CSS (`interpolate-size`, `::details-content`,
scroll-driven animations), y se repitió con el cordón de progreso de lectura
(ADR 0035). En cada caso se decidió a criterio: funciona sin la función nueva,
solo que sin el adorno. Faltaba volver ese criterio una regla (#200).

El sitio no envía JavaScript (`script-src 'none'`), así que todo lo que hace
lo hace el HTML nativo y el CSS. Un *polyfill* tampoco es opción: también es
JavaScript.

## Decisión

### 1. Dos niveles: lo esencial y lo decorativo

- **Lo esencial** es leer, navegar, plegar y desplegar, saltar a una sección
  o letra, y enviar un formulario. Solo usa funciones **Baseline ampliamente
  disponible**.
- **Lo decorativo** son las animaciones, transiciones y pistas visuales. Puede
  usar funciones más nuevas como mejora progresiva: donde faltan, se pierde el
  adorno, no la función.

Es como una casa con rampa y escalera mecánica: la rampa (lo esencial) tiene
que servirle a todos; la escalera (lo decorativo) es un plus que puede estar
apagada sin que nadie se quede afuera.

### 2. El criterio es Baseline, no una lista propia de versiones

[Baseline](https://web.dev/baseline) es la definición pública que mantiene el
WebDX Community Group del W3C en el proyecto
[web-features](https://github.com/web-platform-dx/web-features), con los
navegadores que aportan su propio equipo. Es la misma que muestran MDN (la
insignia de cada página), [webstatus.dev](https://webstatus.dev) y Can I Use.

Una función es **ampliamente disponible** cuando lleva al menos 30 meses en
las versiones estables de Chrome, Chrome Android, Edge, Firefox, Firefox
Android, Safari y Safari iOS. Incluye Safari iOS, así que el piso de los
celulares ya está cubierto sin una lista aparte.

Se descartaron:

- **Una lista de versiones mínimas** (por ejemplo, «iOS Safari ≥ 16.4»).
  Habría que actualizarla a mano, y quedaría vieja sin que nada falle. La
  ventana de 30 meses de Baseline avanza sola.
- **El `defaults` de browserslist**, que se basa en cuotas de uso. Cambia mes
  a mes y no dice nada sobre si una función específica existe.

### 3. Cómo se usa una función que todavía no es Baseline amplio

Solo en lo decorativo, y con estas dos condiciones:

- **Degrada sola.** El navegador que no la conoce ignora la declaración o el
  selector, o la regla va dentro de `@supports`. Si para que lo esencial
  funcione hace falta una regla de respaldo, esa regla va primero y sin
  condición.
- **Lo que se pierde queda escrito.** Un comentario junto a la regla dice qué
  pasa sin la función, como ya lo hacen `DatoConFuente`, `QuipuDeTemas` y
  `ProgresoDeLectura` («donde no existe `interpolate-size`, la letra pliega
  igual, solo que de golpe»).

Si una función solo existe en un navegador o la marcan como *desaconsejada*
(*discouraged*) en web-features, no se usa ni siquiera como adorno, salvo que
el comentario explique por qué y qué la reemplaza.

### 4. Se verifica en la revisión, no con un linter

La regla está en este ADR y en [docs/STANDARDS.md](../STANDARDS.md), que el
subagente `revisor-de-estandares` lee en cada corrida. Quien revisa una
función de CSS o HTML que no conoce busca su insignia de Baseline en MDN o en
webstatus.dev.

Se descartó por ahora un chequeo automático (Stylelint con
`stylelint-plugin-use-baseline` y `postcss-html` para los `<style>` de los
`.astro`). Atraparía los errores solo, pero suma tres dependencias y marca
cada uso decorativo legítimo, que habría que silenciar uno por uno. Si la
revisión deja pasar un caso, ese es el momento de reabrirlo.

## Estado del CSS al aceptar este ADR

Se corrió una sola vez `stylelint-plugin-use-baseline` 1.4.8 (datos de
web-features 3.45.0) sobre `src/**/*.{css,astro}`, sin agregarlo al repo.
Todo lo que marcó ya cumple el §3, salvo lo indicado:

| Función | Dónde | Por qué cumple |
| --- | --- | --- |
| `interpolate-size`, `::details-content`, `content-visibility` | `QuipuDeTemas` | Solo anima el pliegue; sin ellas pliega de golpe (ADR 0026 §4). |
| `::details-content`, `content-visibility` | `DatoConFuente`, `CompartirHistoria` | Abren el panel al pasar el puntero; el toque o el clic lo abren igual, porque es un `<details>` nativo. |
| `view-timeline`, `animation-range`, `@property` | `ProgresoDeLectura`, `IndiceDeLetras` | Van dentro de `@supports` (el `@property`, que no puede, se ignora donde no existe); sin ellas no hay cordón ni degradado, y el texto y el índice funcionan igual. |
| `text-wrap: balance` y `pretty` | `base.css`, `EnlaceExterno` | Solo reparten mejor las líneas. |
| `scrollbar-width` | `IndiceDeLetras` | Solo oculta la barra de desplazamiento; la fila se desliza igual. |
| `resize` | `OpinionHistoria`, `reportar.astro` | Solo controla el tirador del `<textarea>`; se escribe igual. |
| `clip` | `.sr-only` en `base.css`, `LogotipoMistorias` | **Deuda.** Está desaconsejada, aunque sigue funcionando en todos los navegadores, y el resto del patrón (`1px` + `overflow: hidden`) ya oculta el texto por su cuenta. Su reemplazo es `clip-path: inset(50%)`, que queda para otro cambio. |

`:has()`, container queries, `color-mix()`, `mask-image` y el anidamiento de
CSS ya son Baseline amplio.

## Consecuencias

- Una función nueva en algo esencial espera a cumplir 30 meses o se resuelve
  con lo que ya existe. Puede tocar elegir un diseño más simple.
- La regla no requiere mantenimiento: lo que hoy es decorativo pasa a poder
  usarse en lo esencial cuando Baseline lo declara ampliamente disponible,
  sin cambiar este ADR.
- La verificación depende de la revisión, así que un error puede pasar. Por
  eso la revisión mira primero lo esencial: en lo decorativo, un error solo
  quita un adorno.
- [ACCESSIBILITY.md](../../ACCESSIBILITY.md) deja de decir «cualquier
  navegador actual» y enlaza aquí.
