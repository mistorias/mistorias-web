# ADR 0001: Integracion de `mistorias-contenido` con git submodule

## Estado

Aceptado

## Contexto

`mistorias-web` necesita consumir contenido editorial desde `mistorias-contenido`.
Se prioriza seguridad y trazabilidad:

- `mistorias-web` es privado.
- `mistorias-contenido` es publico y colaborativo.
- Solo contenido mergeado por maintainers entra al sitio.
- No se permite HTML crudo en contenido editorial.

## Decision

Se usa `git submodule` en `content/mistorias-contenido` con commit pinning para fijar exactamente la revision de contenido usada por cada version del sitio.

El contenido se valida en dos capas:

1. Esquema tipado en Astro Content Collections (`src/content.config.ts`).
2. Carga segura en `src/lib/content/content-loader.ts`, rechazando HTML crudo en frontmatter y cuerpo markdown.

## Consecuencias

### Positivas

- Versionado y rollback claros del contenido.
- Menor riesgo de inyeccion al bloquear HTML crudo.
- Fallos tempranos por cambios de estructura en contenido.

### Costos

- Actualizar contenido requiere avanzar el puntero del submodulo en `mistorias-web`.
- La colaboracion necesita disciplina de PR review en `mistorias-contenido`.

## Testing

Se agrega `tests/content-flow.spec.ts` con fixtures validas e invalidas para comprobar:

- caso feliz de lectura y normalizacion,
- error por campo requerido ausente,
- rechazo de HTML crudo.

El comando objetivo de validacion es `pnpm test`.

## Notas operativas iniciales

- Para que el submodulo funcione en colaboracion, `mistorias-contenido` debe tener al menos un commit en su rama principal publicada en remoto.
- La plataforma de deploy se definira en una decision posterior.
