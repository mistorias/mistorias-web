# Estándares de documentación

## Dónde vive cada documento

**Todo documento nuevo va en `docs/`.** Es el lugar por defecto y no requiere
justificación.

La raíz del repositorio se reserva para los archivos que GitHub o las
herramientas esperan encontrar ahí, y solo para esos:

| Archivo | Por qué vive en la raíz |
| --- | --- |
| `README.md` | GitHub lo muestra como portada del repositorio |
| `LICENSE` | GitHub detecta la licencia por ubicación |
| `CONTRIBUTING.md` | GitHub lo enlaza al abrir un issue o un PR |
| `SECURITY.md` | GitHub lo enlaza desde la pestaña Security y desde el reporte privado |
| `CLAUDE.md` | Claude Code lo carga desde la raíz del proyecto |
| `CONTEXT.md` | Lenguaje ubicuo del proyecto; se lee antes que cualquier otro documento |

Las decisiones arquitectónicas van en `docs/adr/`, con el formato
`NNNN-titulo-en-kebab-case.md` y numeración correlativa.

Si un documento nuevo necesita vivir en la raíz, la razón se explica en el PR
que lo agrega. "Es importante" no es una razón: casi todo lo que se documenta
lo es. La razón válida es que una herramienta externa lo busque ahí.

## Tamaño

**Un documento es grande cuando supera las 300 líneas** (`wc -l`).

Al llegar a ese límite no se sigue agregando al final: se extrae contenido a
un documento nuevo en `docs/`. Cómo se parte:

- **Alta cohesión.** Se parte por tema completo, nunca por cantidad de líneas.
  Lo que se va debe poder leerse solo y responder una pregunta entera; si al
  extraer una sección hay que llevarse media sección vecina para que se
  entienda, esa no era la frontera.
- **DRY.** Se enlaza, no se copia. Cada tema se explica en un solo documento;
  los demás apuntan a ese. Dos copias de una regla se contradicen apenas una
  cambia, y quien la lee no sabe cuál manda.
- **El documento original queda como punto de entrada.** En el lugar de la
  sección extraída queda una línea que dice qué se fue y adónde, para que
  quien buscaba ahí llegue igual.

Las ADR son la excepción y no se parten: cada una registra una decisión y su
contexto, y ese es su valor como registro histórico. Una ADR que pasa de 300
líneas suele estar registrando más de una decisión — la señal ahí es abrir una
segunda ADR, no partir la primera.

## Mantener CLAUDE.md al día

`CLAUDE.md` es lo primero que lee Claude Code al abrir el repositorio, así que si
queda atrás, cada sesión parte de una descripción que ya no es cierta. Un cambio
que altera la arquitectura, un componente que otros deben reutilizar o una
convención actualiza `CLAUDE.md` **en el mismo PR**, no en uno posterior.
