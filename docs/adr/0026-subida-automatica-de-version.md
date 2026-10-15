# ADR 0026: Un workflow propone la subida de versión según los commits

## Estado

Aceptado

## Contexto

El [issue #194](https://github.com/mistorias/mistorias-web/issues/194) pide dejar de
subir a mano el campo `version` de `package.json`. Desde el
[ADR 0017](0017-version-visible-del-sitio.md), ese campo tiene que coincidir con el
tag del release (`scripts/check_release_version.sh` frena el despliegue si no), así
que olvidarlo o calcularlo mal bloquea la publicación o anuncia en `/acerca` una
versión equivocada.

Pide además:

1. Que corra cada día a la medianoche y bajo demanda.
2. Que decida la subida con SemVer y Conventional Commits: `feat` sube la menor,
   `feat!` la mayor, y cualquier otro tipo el patch, salvo `docs`, `ci`, `style` y
   `test`, que no suben. Entre varios commits gana la subida mayor.
3. Que ignore los cambios que no llegan a lectoras ni lectores (documentación,
   automatización de GitHub, agentes de IA).
4. Que abra un PR que cambie **solo** la línea de la versión.

## Decisión

**Un script propio calcula la versión desde el último tag, y un workflow la propone
en un PR que nunca se fusiona solo.**

1. `src/lib/release/version-bump.ts` es la lógica pura y testeada. Para cada commit:
   - Si todas sus rutas son de `docs/`, `.github/`, `.claude/`, `tests/`,
     `.devcontainer/`, `stryker.config.*` o terminan en `.md`, no cuenta, sea cual
     sea su tipo.
   - Si llega a los lectores y no es convencional, el cálculo **falla** y lista todos
     esos commits. Adivinar la subida sería peor que pedir que se corrija.
   - Un `!` en cualquier tipo o un pie `BREAKING CHANGE:` pide una versión mayor,
     como dice la especificación (no solo `feat!`).
2. `scripts/next-version.ts` (`pnpm next-version`) toma como base **el último tag
   `v*`, no `package.json`**. Así, si ya se fusionó un 1.8.1 sin publicar y después
   llega un `feat`, propone 1.9.0 y no 1.8.2, y nunca encadena versiones que no
   salieron. Correrlo dos veces da lo mismo, y nunca baja la versión.
3. `scripts/check_version_only_diff.sh` falla si el cambio es algo distinto de una
   línea `"version"` en `package.json`.
4. `.github/workflows/subir-version.yml` corre a las 00:00 de Lima y bajo demanda.
   Abre o actualiza un único PR desde la rama `version/subir`, con el mismo App y
   el mismo patrón que `actualizar-contenido.yml`. Nunca fusiona ni etiqueta.

Como el tipo del commit decide la subida, los commits que solo cambian la
automatización de GitHub usan `ci` aunque traigan JS/TS
([docs/STANDARDS.md](../STANDARDS.md#conventional-commits)). Los commits de este
mismo cambio son `ci` y no suben la versión.

### Por qué no una librería

Las opciones populares hacen más de lo que se pide, y eso choca con el alcance.
release-please mantiene un CHANGELOG y crea releases. semantic-release etiqueta y
publica por su cuenta. Las dos romperían "solo la línea de la versión" y "publicar
lo decide una persona". `conventional-recommended-bump` sí calcula solo el tipo de
subida, pero no filtra por rutas, y ese filtro igual habría que escribirlo. Las
reglas caben en un archivo chico, cada caso queda cubierto por un test, y no se
agrega ninguna dependencia.

## Consecuencias

- Cortar un release es fusionar el PR de versión y crear el tag `v` + esa versión.
  Ya no hay que acordarse de editar `package.json`.
- Un commit no convencional que toque el sitio detiene el workflow hasta que se
  corrija (por ejemplo, con un commit convencional que lo reemplace). Es
  deliberado.
- El commit del propio PR (`chore: la versión va de X a Y`) cuenta como patch en la
  siguiente corrida. Es inofensivo, porque la base sigue siendo el tag.
- Fuera del alcance: el auto-merge de estos PR. Se investiga en el
  [issue #197](https://github.com/mistorias/mistorias-web/issues/197), y
  `check_version_only_diff.sh` es el mecanismo de seguridad del que puede partir.
