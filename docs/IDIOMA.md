# Idioma

El proyecto escribe en dos idiomas y cada uno tiene su lugar. La regla corta:
**el código se lee en inglés; todo lo que explica el código se lee en
castellano peruano.**

## Código: inglés

Se escriben en inglés los identificadores (variables, funciones, tipos,
constantes), los nombres de archivos y módulos, las claves de frontmatter
(`title`, `summary`, `date`, `author`, `themes`) y los mensajes de error de las
validaciones del build.

No se mezclan idiomas dentro de un mismo identificador: `getStories` sí,
`getHistorias` no.

## Excepción: los componentes de Astro

Los componentes en `src/components/`, las páginas y los layouts se escriben en
castellano cuando nombran un elemento de la marca o del dominio editorial:
`LogotipoMistorias.astro`, `TarjetaHistoria.astro`, `CabeceraSitio.astro`. Son
el borde del sistema que da la cara al lector, y ahí el nombre del dominio
comunica mejor que su traducción.

La excepción no se queda en el nombre del archivo: alcanza también a lo que vive
adentro —props como `historia`, `temaTextual` o `nivelTitulo`, y variables
como `grupos` o `enlace`—. Ese vocabulario es el mismo de
[CONTEXT.md](../CONTEXT.md), y traducirlo solo dentro del componente partiría en dos
el lenguaje con que se habla de la misma cosa.

El límite es `src/lib/`: la lógica que no da la cara al lector se escribe en
inglés, y en la frontera el componente en castellano consume funciones en inglés
(`storyRoute`, `groupByTheme`).

## Excepción: lenguaje de cara al lector

Las rutas públicas (`/historias/`, `/temas/`) y todo el texto que ve
quien lee el sitio siguen en castellano. Son parte del lenguaje ubicuo del
proyecto, no del código — ver [CONTEXT.md](../CONTEXT.md).

## Comentarios y documentación: castellano peruano

Los comentarios, los docstrings, los mensajes de commit, las descripciones de
PR y los documentos del repositorio se escriben en castellano peruano. Los
comentarios explican el *por qué*, no el *qué* (ver
[docs/STANDARDS.md](STANDARDS.md#principios-fundamentales)).

## Tests: el mismo límite que el código

Los tests (`tests/*.spec.ts`) son TypeScript y no entran en la excepción de los
componentes: sus identificadores van en inglés, igual que el código que prueban.
`renderLink`, `links` y `profile`, no `renderizar`, `enlaces` ni `perfil`.

- **Un test de `src/lib/`** va íntegro en inglés, incluido el vocabulario del
  dominio (`story`, no `historia`).
- **Un test de un componente, página o layout** puede usar el vocabulario en
  castellano del propio componente cuando lo nombra: las props que declara
  (`variante`, `avisoAlineado`) y los términos de [CONTEXT.md](../CONTEXT.md). Los
  pasa por su nombre y traducirlos solo en el test partiría en dos el lenguaje. Lo
  genérico —funciones auxiliares, variables de iteración, resultados— va en
  inglés.
- **Los títulos** (`it("…")`, `describe("…")`) y los comentarios van en
  castellano peruano: explican el comportamiento, no son identificadores.

## Identificadores mezclados

Un identificador no mezcla idiomas: `valoresRel` sí (el nombre HTML `rel` no es de
ningún idioma), `relCompleto` no (`rel` + castellano) ni `getHistorias`. Los nombres
que vienen de HTML, CSS o de una librería se escriben como son.

## Estado actual

`src/lib/` está íntegramente en inglés: ahí viven `dates.ts`, `stories.ts`,
`themes.ts`, `routes.ts`, `deployment.ts` y los gates de `content/` y `brand/`.
Los componentes, las páginas y los layouts siguen en castellano por la
excepción de arriba, y eso no es deuda pendiente: no se traducen.

Si aparece un nombre en castellano fuera de esa excepción, se corrige antes de
que se acumule: no se espera a que el archivo se toque por otra razón. El
renombrado va en un commit aparte del cambio funcional, para que se pueda
revisar y revertir solo.

## Quién lo revisa

Después de modificar código y antes de commitear, el subagente
[`revisor-de-estandares`](../.claude/agents/revisor-de-estandares.md) revisa el
cambio contra este documento y el resto de los estándares.
