# ADR 0019: Mutation testing con Stryker, con reporte diario en GitHub Pages

## Estado

Aceptado

## Contexto

[Issue #112](https://github.com/mistorias/mistorias-web/issues/112) señala que
la cobertura de líneas (`pnpm test`, ver
[docs/STANDARDS.md](../STANDARDS.md#control-de-cobertura)) solo dice que un
test *ejecutó* una línea, no que *detectaría* un cambio en ella. Mutation
testing corre variantes ligeramente rotas del código («mutantes») y mide
cuántas matan los tests existentes: es la métrica que responde la pregunta que
la cobertura no puede.

El issue pide, en concreto:

1. Correrlo en el pipeline solo sobre los archivos modificados, sin bloquear
   el build todavía (el umbral llegó después, §2).
2. Correrlo completo una vez al día (9pm UTC).
3. Tener el reporte HTML disponible en un link, sin necesitar descomprimirlo.

## Decisión

### 1. Stryker (`@stryker-mutator/core` + `@stryker-mutator/vitest-runner`)

Es la sugerencia del propio issue y el estándar de facto para JS/TS. El
runner de Vitest evita duplicar la configuración del test runner: reutiliza
`vitest.config.ts` (y, con él, `astro/config#getViteConfig`) tal como lo hace
`pnpm test`.

`@stryker-mutator/core` autodescubre plugins buscando `@stryker-mutator/*` en
`node_modules`, pero ese descubrimiento asume un `node_modules` plano. Con
pnpm no lo es, así que `stryker.config.mjs` declara `plugins:
["@stryker-mutator/vitest-runner"]` explícitamente —confirmado localmente:
sin esa línea, Stryker falla con «no TestRunner plugins were loaded».

`mutate` se limita a `src/**/*.ts`. Los `.astro` quedan afuera: Stryker no
tiene un mutador para ese lenguaje, y `src/lib/` (donde vive casi toda la
lógica no visual) es TypeScript puro.

### 2. Umbral de 75%, también en el PR

Al principio `thresholds.break` no se definía: un mutante sobreviviente no
hacía fallar nada, para dar visibilidad primero. Esa falta de umbral dejó que
el reporte saliera en 0% durante días sin que nadie lo notara (ver §7). Ahora
`thresholds.break` es 75: un puntaje menor termina `pnpm mutation-test` con
código 1. Con vitest 4.1 el puntaje total es ~85%, así que 75 deja margen.

El umbral bloquea en los dos lugares donde corre Stryker. El workflow
nocturno publica el reporte aunque el puntaje esté bajo el umbral y falla en
su último paso, con el reporte ya publicado. La corrida por PR (§3) falla en
el paso mismo, y su reporte se sube igual como artefacto.

Costo conocido: en el PR el puntaje se mide solo sobre los `.ts` que cambió,
y un archivo pequeño con pocos mutantes baja de 75% con un solo mutante
sobreviviente (hoy `robots.ts` está en 50%). Un PR que lo toque falla hasta
que se refuercen sus tests.

### 3. En el pipeline: solo los `.ts` que cambiaron, vía `--mutate`

Esta versión de Stryker no tiene un flag `--since` que filtre por archivos
modificados —se verificó leyendo su CLI (`stryker-cli.js`)—, pero sí acepta
`-m, --mutate <archivos>` para acotar manualmente el conjunto a mutar. El paso
nuevo en `ci.yml` calcula ese conjunto con `git diff --name-only` contra la
base del PR (o el commit anterior en un push a `main`) y se lo pasa a
`pnpm mutation-test -- --mutate "…"`. Si no cambió ningún `.ts`, el paso se
omite entero.

Esto mantiene acotado el tiempo del pipeline —mutar todo `src/lib/` en cada
PR sería correr la suite completa decenas de veces—. Es bloqueante, por lo
explicado en el punto 2.

El reporte de esta corrida parcial se sube como artefacto normal de GitHub
Actions (`actions/upload-artifact`). Sí requiere descomprimir para verlo: el
requisito de «sin descomprimir» del issue se resuelve con el reporte nocturno
(punto 5), no con este.

### 4. Diario a las 9pm UTC: workflow nuevo, no un paso más en `ci.yml`

`mutation-testing-nightly.yml` corre `pnpm mutation-test` sin `--mutate`
(usa el default de `stryker.config.mjs`: todo `src/**/*.ts`) por `schedule`
(`cron: "0 21 * * *"`) y por `workflow_dispatch` para poder dispararlo a
mano. Va en un workflow separado de `ci.yml` porque no comparte disparador
(cron, no push/PR) ni razón de ser: uno verifica un cambio, el otro fotografía
el estado completo del código una vez al día.

### 5. El reporte nocturno se publica en GitHub Pages, dentro del sitio

El reporte HTML de Stryker es un solo archivo autocontenido (JS y CSS
inline, confirmado leyendo `html-reporter.js` del paquete) — no hay que
resolver rutas relativas a otros archivos. El problema es dónde alojarlo para
que abra con un clic.

Este repo despliega a GitHub Pages con `actions/deploy-pages`, que usa
GitHub Actions como *fuente* de Pages (no una rama `gh-pages`). Esa fuente
solo admite un despliegue a la vez para todo el sitio: cualquier deploy nuevo
reemplaza el contenido anterior por completo. No hay forma de «agregarle una
carpeta» al despliegue existente sin volver a construir el sitio entero y
subir el árbol completo, reporte incluido.

Por eso `mutation-testing-nightly.yml` reconstruye el sitio (`pnpm build`,
mismo `DEPLOY_TARGET: development` que
[`deploy-github-pages.yml`](../../.github/workflows/deploy-github-pages.yml))
y copia el reporte a `dist/reporte-mutacion/index.html` antes de desplegar,
quedando publicado en `<url-del-sitio>/reporte-mutacion/`. El job comparte el
`concurrency: group: pages` con el workflow de despliegue normal (con
`cancel-in-progress: false`) para que no compitan por el mismo destino.

Se evaluaron y descartaron:

- **Publicar el reporte de la corrida nocturna solo como artefacto de
  Actions.** Es justamente lo que el issue pide evitar: GitHub siempre
  empaqueta artefactos en un `.zip` para descargarlos desde la UI, incluso
  cuando es un solo archivo.
- **Un sitio de GitHub Pages aparte solo para el reporte.** Pages permite un
  único sitio por repositorio; publicar el reporte ahí habría significado
  reemplazar el sitio real.
- **Publicarlo en Netlify.** El proyecto ya despliega ahí, pero como sitio de
  producción (mistorias.pe): sumarle una ruta de reportes internos mezclaría
  contenido editorial con herramienta de desarrollo, y requeriría gestionar
  credenciales de Netlify en un workflow nuevo sin necesidad real.

### 6. `ignoreStatic: true`

La mayoría de mutantes en este código son estáticos (constantes, schemas Zod
evaluados al importar el módulo): sin esta opción, Stryker corre la suite de
tests completa por cada uno de esos mutantes en vez de una sola vez. Es una
recomendación estándar de Stryker para este patrón, no una optimización
prematura: se confirmó localmente que sin ella un archivo pequeño (11
mutantes, todos estáticos) disparaba una advertencia explícita de Stryker.

### 7. vitest fijado en 4.1 mientras el runner no soporte vitest 5

`@stryker-mutator/vitest-runner` 10 no funciona con vitest 5: desde el bump a
5.0.2 (`e842606`, corrida nocturna #23) todos los mutantes corren con 0 tests
("Ran 0.00 tests per mutant"), sobreviven y el reporte sale en 0%. Se
bisectó con los lockfiles de las 28 corridas nocturnas y se reprodujo en
local: con vitest 4.1.9 `routes.ts` daba 100% y con 5.0.2, 0%, con la misma
configuración y el mismo Stryker. En vitest 5 cambió el formato de
`fullTestName` y la cobertura por test (ver stryker-js
[#6240](https://github.com/stryker-mutator/stryker-js/issues/6240)).

`ignoreStatic` no era la causa y su razón de ser (§6) sigue vigente. Se fijan
`vitest` y `@vitest/coverage-v8` en `4.1.11` (la versión que el runner usa) y
Dependabot ignora sus actualizaciones mayores. Se quita esa regla cuando el
runner soporte vitest 5. Dependabot no permite que un `ignore` venza por
fecha (su `cooldown` cuenta desde el lanzamiento de cada versión, y vitest
5.0.0 ya salió hace más de cuatro semanas), así que la regla lleva en el
archivo una fecha de revisión: 2026-11-02.

## Consecuencias

### Positivas

- El equipo puede ver, en cada PR que toque `.ts`, si los tests que
  cambiaron detectarían una regresión real en ese código —no solo si lo
  ejecutan.
- El reporte completo diario da una fotografía del estado real de las
  pruebas sin que nadie tenga que acordarse de correrlo ni descomprimir nada.
- El pipeline falla si el puntaje baja de 75%, tanto en el PR como en la
  corrida nocturna, incluido el caso de un runner roto que mida 0%.

### Costos

- vitest queda atrasado una versión mayor hasta que Stryker lo soporte.
- El workflow nocturno reconstruye y redespliega el sitio completo de GitHub
  Pages una vez al día, incluso si nadie publicó nada nuevo. El contenido no
  cambia (viene del mismo `main`), pero sí queda un despliegue nuevo por día
  en el historial de Pages.
- Correr mutation testing completo escala con el tamaño de `src/lib/`; si
  llega a no caber en la ventana nocturna, hará falta paralelizar el job o
  separar la construcción del sitio de la corrida de Stryker en dos jobs.
- `stryker.config.mjs` declara `plugins` a mano porque pnpm no deja
  `node_modules` plano; si el proyecto cambiara de gestor de paquetes, esa
  línea debería revisarse (podría dejar de ser necesaria, o de alcanzar).

## Verificación

1. `pnpm mutation-test -- --mutate src/lib/brand/wordmark.ts` corre completo y
   deja el reporte en `reports/mutation/index.html`.
2. En un PR que modifique algún `.ts` bajo `src/`, el job `Verificación`
   muestra el paso «Mutation testing en los archivos modificados» y sube el
   artefacto `reporte-mutacion`.
3. En un PR que no toque ningún `.ts`, ese paso no corre (el `id: cambios`
   queda vacío).
4. En un PR que toque un archivo bajo 75% (p. ej. `robots.ts`), el paso
   falla y el reporte se sube igual.
5. Disparando `Mutation Testing Nocturno` manualmente (`workflow_dispatch`),
   el resumen del job termina con un link a
   `<url-del-sitio>/reporte-mutacion/` y esa URL abre el reporte
   directamente, sin descargar nada.
