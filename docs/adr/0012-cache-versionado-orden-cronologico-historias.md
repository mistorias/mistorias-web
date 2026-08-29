# ADR 0012: Cache versionado del orden cronológico de historias

## Estado

Aceptado

## Contexto

El [issue #34](https://github.com/mistorias/mistorias-gestion-de-producto/issues/34)
pide que cada historia muestre, al final, un enlace a la historia
cronológicamente anterior y otra a la siguiente, calculado en tiempo de build
y siempre por fecha. El issue pide, además, tres cosas concretas más allá del
enlace en sí: un script que defina ese orden, un archivo de cache para no
reprocesarlo, y un parámetro para reconstruir el cache desde cero.

El issue sugiere que ese script "puede" ir en `mistorias-contenido`. Se
descartó: ese repositorio es público y colaborativo, y no tiene ningún
tooling de código hoy —ni `package.json`, ni un solo script—; [ADR 0001](0001-submodule-contenido-seguro.md)
fija justamente la separación entre contenido (texto, revisado por
maintainers, sin ejecutables) y código (este repositorio). Todo lo que sigue
vive en mistorias-web.

Con las 5 historias actuales, recalcular el orden completo en cada build es
trivial: ordenar 5 fechas no pesa nada. El cache que pide el issue no
resuelve, hoy, un problema de performance real —eso se documenta acá tal
cual, no se inventa una justificación de escala que todavía no existe—; lo
que sí resuelve es dejar el orden cronológico como un artefacto explícito,
auditable en el historial de git, y reusable entre máquinas sin depender de
que cada build lo recalcule desde el contenido.

## Decisión

### El cache se versiona en git, no se ignora

`data/story-order.json` se commitea. Se descartó `.gitignore`-arlo (el patrón
que usa `.claude/cache/` en mistorias-contenido para el cache de los hooks de
Claude Code): ese cache es descartable porque cualquier máquina lo puede
regenerar sin coordinación; este cache es, en cambio, el artefacto que el
issue pide como entregable —el equipo quiere poder ver en el diff de un PR
cuándo cambió el orden de publicación, y que el mismo archivo sirva sin
regenerarlo en cualquier checkout o en CI.

### El cache es legible por humanos

```json
{
  "generatedAt": "2026-08-29T22:01:54.298Z",
  "hash": "f27c0961a511d65b8204d507885f02ffc4f4d7c58f3571ef0c81dabee78f5be4",
  "order": ["2026-07-24-...", "2026-07-31-...", "..."],
  "stories": {
    "2026-07-24-...": { "previous": null, "next": "2026-07-31-..." }
  }
}
```

`order` es la línea de tiempo completa, para que abrir el archivo alcance
para auditarlo a simple vista. `stories` es el mapa de acceso O(1) que
consume el build. `generatedAt` deja constancia de cuándo se generó esa
versión.

### El hash de invalidación depende solo del orden, no de la fecha exacta

`hash` es sha256 de la secuencia ordenada de ids (`order.join("\n")`) — no de
pares `(id, fecha)`. La relación anterior/siguiente depende únicamente del
**orden**, no del valor exacto de cada fecha: si una fecha cambia sin alterar
el orden relativo, el vecindario sigue siendo el mismo y el hash,
correctamente, no cambia. Si el orden cambia, o se agrega, quita o renombra
una historia, el hash sí cambia y el cache queda invalidado. Un hash sobre
`(id, fecha)` sería más sensible de lo necesario: invalidaría el cache ante
cambios que no afectan a ningún lector.

### El script es la única vía para escribir el cache; el build nunca escribe

`scripts/generate-story-order-cache.ts` (`pnpm story-order`, o
`pnpm story-order -- --rebuild` para forzar la reescritura aunque el hash no
haya cambiado) lee `stories/*.md` directamente del disco —sin pasar por
`getCollection` ni el runtime de Astro, mismo criterio que ya usan los gates
de seguridad en `src/lib/content/`— y escribe `data/story-order.json`.

`getStaticPaths` en `src/pages/historias/[...id].astro` (PR de la parte
visual) consume ese cache a través de `resolveNeighbors`
(`src/lib/content/story-order-cache.ts`): si el archivo existe y su hash
coincide con el orden actual de las historias que el build ya cargó, usa su
mapa de vecinos; si no existe o quedó desactualizado, calcula el orden en
memoria a partir de esas mismas historias. El build **nunca** escribe el
cache — mutar un archivo versionado en git como efecto secundario de
renderizar páginas rompería la trazabilidad que el cache versionado busca
dar, y dejaría builds distintos escribiendo distintas versiones del mismo
archivo sin que nadie las revise.

Esto hace que el sitio sea correcto con o sin cache al día: el cache es una
optimización y un artefacto auditable, nunca una condición para que la
navegación anterior/siguiente funcione.

## Consecuencias

### Positivas

- El sitio nunca puede mostrar un vecino incorrecto por un cache
  desactualizado: el peor caso es no usar el atajo del cache y calcular en
  memoria, con el mismo resultado.
- El orden de publicación queda auditable en el historial de git,
  independientemente de si alguien corrió el script.
- No se agrega ninguna dependencia nueva: `scripts/generate-story-order-cache.ts`
  corre con `node` directo (Node 24, fijado en `.nvmrc`, ejecuta `.ts`
  nativamente) — sin `tsx` ni `ts-node`.

### Costos

- Quien agrega, quita, renombra o re-fecha una historia debe recordar correr
  `pnpm story-order` y commitear `data/story-order.json` junto con el cambio
  de contenido (documentado en [CONTRIBUTING.md](../../CONTRIBUTING.md)); si
  lo olvida, el sitio sigue siendo correcto vía el fallback en memoria, solo
  sin el atajo del cache.
- Los módulos que forman parte del grafo de este script
  (`src/lib/content/story-order.ts`, `story-order-cache.ts`,
  `story-order-source.ts`) importan entre sí con extensión `.ts` explícita
  en vez de la convención sin extensión del resto de `src/lib/`: lo exige la
  resolución de módulos ESM de Node cuando el script corre directo, sin
  bundler. Queda comentado en cada import para que no se "corrija" a la
  convención general por error.

## Testing

- `tests/story-order.spec.ts` — orden ascendente por fecha, desempate por id,
  vecinos en los extremos y en el centro, y que el hash depende del orden y
  no de la fecha exacta.
- `tests/story-order-cache.spec.ts` — lectura de un cache ausente o corrupto,
  escritura legible, validez del hash, y que `resolveNeighbors` cae al
  cálculo en memoria sin escribir nada cuando el cache falta o quedó
  desactualizado.
- `tests/story-order-source.spec.ts` — lectura de `date` desde el frontmatter
  crudo, con y sin comillas, ignorando las carpetas de imagen de cada
  historia, y el error explícito cuando falta una fecha válida.
