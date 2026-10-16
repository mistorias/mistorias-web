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

La excepción cubre la **interfaz** del componente, no su interior:

- **En castellano:** el nombre del archivo, sus props (`historia`, `temaTextual`,
  `nivelTitulo`) y los parámetros de ruta que nacen del nombre del archivo
  (`[tema]`, `[autor]`). Es lo que se nombra al usar el componente, y comparte el
  vocabulario de [CONTEXT.md](../CONTEXT.md).
- **En inglés:** todo lo demás que vive adentro. Eso incluye variables locales,
  funciones, parámetros, tipos y claves de objetos locales (`groups`, `link`,
  `isFirst`, `roundingFor`, `type Rounding`). Se lee igual que `src/lib/`.

Cuando una prop recibe una variable local, la prop conserva su nombre y la
variable va en inglés: `<QuipuDeHistorias anos={years} />`.

No son identificadores, así que la regla no los toca: las clases CSS y las
custom properties (`.quipu-semana`, `--tamano`), los valores de texto de una prop
(`redondeo="arriba"`) y los `id` del HTML. El porqué de este borde está en el
[ADR 0027](adr/0027-identificadores-internos-de-componentes-en-ingles.md).

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
- **Un test de un componente, página o layout** usa en castellano solo las props
  que el componente declara (`variante`, `avisoAlineado`), porque las pasa por su
  nombre. Todo lo demás —funciones auxiliares, fixtures, variables de iteración,
  resultados— va en inglés, igual que el interior del componente.
- **Los títulos** (`it("…")`, `describe("…")`) y los comentarios van en
  castellano peruano: explican el comportamiento, no son identificadores.

## Identificadores mezclados

Un identificador no mezcla idiomas: `relValues` sí, `relCompleto` no (`rel` +
castellano) ni `getHistorias`. Los nombres
que vienen de HTML, CSS o de una librería se escriben como son.

## Estado actual

`src/lib/` está íntegramente en inglés: ahí viven `dates.ts`, `stories.ts`,
`themes.ts`, `routes.ts`, `deployment.ts` y los gates de `content/` y `brand/`.
Los componentes, las páginas y los layouts tienen en castellano su nombre y sus
props, y en inglés todo lo de adentro.

Si aparece un nombre en castellano fuera de esa excepción, se corrige antes de
que se acumule: no se espera a que el archivo se toque por otra razón. El
renombrado va en un commit aparte del cambio funcional, para que se pueda
revisar y revertir solo.

## Quién lo revisa

Después de modificar código y antes de commitear, el subagente
[`revisor-de-estandares`](../.claude/agents/revisor-de-estandares.md) revisa el
cambio contra este documento y el resto de los estándares.
