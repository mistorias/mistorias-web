# Estándares de Desarrollo

Este archivo documenta los estándares de código, commits y pull requests para los proyectos de Mistorias.

## Marca y Lineamientos Editoriales

Todo el trabajo debe alinearse con la [esencia de marca de Mistorias](https://github.com/mistorias/mistorias-esencia-de-marca):

- **Empatía** — personas antes que datos
- **Transparencia** — contexto claro, fuentes visibles
- **Empoderamiento** — comprensión que habilita la acción
- **Claridad** — lo complejo se vuelve entendible

Esto se traduce en código **centrado en las personas**, **transparente**, **que empodera a quienes contribuyen** y **claro**.

## Estándares de Código

El idioma en que se escribe cada cosa —código en inglés, comentarios y
documentación en castellano peruano, con sus excepciones— está definido en
[CONTRIBUTING.md](../CONTRIBUTING.md#idioma).

### Principios Fundamentales

El código de Mistorias sigue:

1. **Principios SOLID**
   - Responsabilidad Única — cada módulo tiene una sola razón para cambiar
   - Abierto/Cerrado — abierto a extensión, cerrado a modificación
   - Sustitución de Liskov — los subtipos deben poder sustituir a sus tipos base
   - Segregación de Interfaces — varias interfaces específicas en vez de una general
   - Inversión de Dependencias — depender de abstracciones, no de implementaciones concretas

2. **Código Limpio**
   - Nombres significativos que revelan la intención
   - Funciones pequeñas y enfocadas (que hagan una sola cosa bien)
   - Los comentarios explican el *por qué*, no el *qué* (el código ya muestra el qué)
   - DRY: No te repitas — extrae los patrones que se repiten, evitando caer en abstracciones prematuras (ver [Sin Abstracciones Prematuras](#sin-abstracciones-prematuras))
   - Sin optimización prematura

3. **Arquitectura Limpia**
   - Separación de responsabilidades (lógica de negocio, UI, infraestructura)
   - Las dependencias apuntan hacia adentro (nunca hacia afuera)
   - La lógica de dominio central es independiente de los frameworks
   - Diseñado para ser testeable

4. **Alta Cohesión, Bajo Acoplamiento**
   - La funcionalidad relacionada se agrupa junta
   - Dependencias mínimas entre módulos
   - Contratos claros entre capas

5. **Programación Funcional Siempre Que Sea Posible**
   - Preferir inmutabilidad y funciones puras
   - Evitar efectos secundarios en los límites del sistema
   - Preferir composición antes que herencia
   - Usar el sistema de tipos de TypeScript de forma expresiva
   - Aplicar estos principios siempre que el contexto lo permita; si el framework o la librería exige un enfoque imperativo (por ejemplo, ciclo de vida de componentes), se documenta el motivo

6. **Desarrollo Guiado por Pruebas (TDD)**
   - El test se escribe siempre primero: nunca después ni junto con la implementación. Se empieza con un test que falla (rojo primero); esto garantiza que el test no tenga falsos positivos ni falsos negativos
   - Se implementa lo mínimo necesario para que el test pase, nada más
   - Si se quiere agregar más código o funcionalidad, primero se debe crear un test que lo cubra
   - Ciclo Rojo → Verde → Refactor
   - El coverage debe ser mayor a 90%
   - Esto último no depende de que alguien lo recuerde: `pnpm test` mide la
     cobertura en cada corrida y falla si no supera ese 90%, de modo que el
     pipeline bloquea el PR. El número vive en `vitest.config.ts` y en ningún
     otro lado (ver [Control de cobertura](#control-de-cobertura))

### Control de cobertura

La cobertura no es un lineamiento a recordar: es un control del pipeline.

- **Dónde vive el umbral.** En `vitest.config.ts`, con el 90% que pide el
  estándar de TDD. Es el único lugar donde se define ese número; el workflow de
  CI no lo repite, solo corre `pnpm test`.
- **Qué se mide.** El TypeScript de `src/`, en líneas, sentencias, funciones y
  ramas — las cuatro métricas contra el mismo umbral. Desde issue #33,
  `src/**/*.astro` también entra en `coverage.include`, pero Vitest solo cuenta
  un archivo cuando algún test lo importa o renderiza de verdad: hoy eso alcanza
  a los componentes con lógica propia probados vía la Container API de Astro
  (`LogotipoMistorias`, `TarjetaHistoria`, `ListaTemas`, `BaseLayout`, y los
  hijos que arrastran al renderizarse) — no a todo `.astro` del proyecto. La
  mayoría de `src/pages/` y otros componentes de puro maquetado siguen sin red
  de tests; ampliarla es trabajo pendiente, componente por componente, no una
  meta de "100% de `.astro`".
- **Cuándo corre.** En cada `pnpm test`, no solo en CI, para que un PR no se
  abra creyendo que pasa.
- **Dónde se ve.** La tabla por archivo sale en la salida de la corrida; en CI
  el resumen se publica además en la pestaña del job, también cuando el umbral
  falla, que es cuando más hace falta leerlo.

Bajar el umbral es una decisión del equipo, no un arreglo para desatorar un PR:
si un cambio no llega, lo que falta son tests. `tests/cobertura.spec.ts` cuida
que el control no se apague en silencio.

### Específico de TypeScript

- Usar modo estricto (definido en `tsconfig.json`)
- Preferir `type` sobre `interface`, salvo que se necesite comportamiento tipo clase
- Evitar `any` — usar `unknown` si es necesario, y luego acotar el tipo
- Usar Zod para la validación en tiempo de ejecución de datos externos (como en `storySchema`)

### Sin Abstracciones Prematuras

Tres líneas de código similares son preferibles a una función auxiliar creada antes de tiempo. Si un patrón se repite en distintos dominios, se extrae. Si está aislado, se deja tal cual.

### Enlaces

Texto descriptivo, un solo enlace accesible por tarjeta cuando hay una zona
clicable extendida, y cómo estirar ese enlace con CSS puro sin duplicar el
destino para quien navega con lector de pantalla: ver
[docs/ENLACES.md](ENLACES.md).

---

## Estándares de Commits

### Conventional Commits

Todos los commits siguen [Conventional Commits](https://www.conventionalcommits.org/) en castellano (o en inglés si el código base ya usa ese idioma).

Formato:
```
<tipo>(<alcance>): <asunto en presente>

<cuerpo explicando el por qué y el qué>
```

**Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Ejemplo (castellano, preemptive):**
```
feat(docker): el desarrollador dispone de Dockerfile y entrypoint para dev container

Se proporciona un Dockerfile basado en node:24-bookworm-slim que emula
el entorno de despliegue. El entrypoint inicializa submodules e
instala dependencias de forma idempotente.

Cierra #19
```

### Atomic Commits

Cada commit representa un cambio lógico y autocontenido:

- No mezclar refactors sin relación con trabajo de features
- Una feature por commit (o una sub-feature pequeña si la feature es grande)
- Un bug fix por commit
- No commitear código WIP o parcialmente testeado

Esta práctica también aplica al agente de IA que desarrolla sobre este repositorio: hacer commits atómicos genera puntos de checkpoint, de modo que se pueda revertir a cualquiera de los distintos puntos de progreso si algo sale mal.

Ejemplo: si se corrige un bug y se mejora la documentación, se hacen dos commits (siguiendo el formato preemptive):
- `fix: la fecha se valida correctamente en el formulario`
- `docs: el flujo de validación queda explicado en el README`

### Preemptive Commits

Los commits describen el **resultado** del cambio en presente, en tercera persona, enfocándose en:
- **Qué gana el sistema** (para infraestructura, build o funcionalidad nueva)
- **Qué puede hacer el usuario** (para features nuevas)
- **Qué puede hacer el desarrollador** (para scripts, pipelines, documentación)

Ejemplos:

**Infraestructura/Build:**
- ✅ `build: Dockerfile es disponible para levantar dev container`
- ❌ `add Dockerfile` (muy pasivo)

**Feature de cara al usuario:**
- ✅ `feat: el usuario puede filtrar historias por tema`
- ❌ `feat: agregar filtro de temas` (describe la acción, no el resultado)

**Herramientas para el desarrollador:**
- ✅ `chore: el desarrollador dispone de script para limpiar volúmenes Docker`
- ❌ `add cleanup script` (muy genérico)

---

## Estándares de Pull Requests

### Descripción del PR

Todo PR debe incluir:

1. **Qué cambió** — un resumen en una línea del cambio
2. **Por qué cambió** — el problema que resuelve o el requerimiento que cumple
3. **Cómo verificarlo** — pasos para probar el cambio (correr tests, revisar una feature, etc.)
4. **Issue relacionado** — enlace al issue si aplica (ej. `Closes #19`)

**Plantilla:**

```markdown
## Qué

[Resumen del cambio en una línea]

## Por qué

[Problema que resuelve o requerimiento. Enlazar contexto: issue, ADR, discusión.]

## Cómo Verificar

- [ ] Correr `pnpm test` — los tests pasan
- [ ] Correr `pnpm build` — el build es exitoso
- [ ] Navegar a http://localhost:4321 y [acción específica] funciona

## Relacionado

Closes #XX
```

### Antes de Solicitar Revisión

- Todos los tests pasan localmente (`pnpm test`, `pnpm build`)
- El type check de TypeScript pasa (`pnpm astro check`)
- Los commits son atómicos y siguen Conventional Commits
- La rama está actualizada respecto a `main`
- No hay código de debug ni líneas comentadas sin usar

### Título del PR

Debe seguir el formato de Conventional Commits, y además redactarse en estilo preemptive (ver [Preemptive Commits](#preemptive-commits)):
```
feat: el usuario puede filtrar historias por tema (issue #XX)
fix: la fecha se valida correctamente en el formulario (issue #YY)
docs: docs/STANDARDS.md es disponible íntegramente en castellano
```

---

## Estándares de Documentación

### Dónde vive cada documento

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

### Tamaño

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

Este mismo documento se rige por la regla: si cruza las 300 líneas, esta
sección es la candidata natural a mudarse a `docs/DOCUMENTACION.md`, porque es
la que menos depende del resto.

---

## Referencias

- [Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca) — principios de marca, lineamientos editoriales
- [CLAUDE.md](../CLAUDE.md) — resumen de arquitectura
- [CONTEXT.md](../CONTEXT.md) — lenguaje ubicuo del proyecto
- [CONTRIBUTING.md](../CONTRIBUTING.md) — configuración y flujo de desarrollo
- [adr/](adr/) — decisiones arquitectónicas
