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

### Específico de TypeScript

- Usar modo estricto (definido en `tsconfig.json`)
- Preferir `type` sobre `interface`, salvo que se necesite comportamiento tipo clase
- Evitar `any` — usar `unknown` si es necesario, y luego acotar el tipo
- Usar Zod para la validación en tiempo de ejecución de datos externos (como en `storySchema`)

### Sin Abstracciones Prematuras

Tres líneas de código similares son preferibles a una función auxiliar creada antes de tiempo. Si un patrón se repite en distintos dominios, se extrae. Si está aislado, se deja tal cual.

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

## Referencias

- [Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca) — principios de marca, lineamientos editoriales
- [CLAUDE.md](../CLAUDE.md) — resumen de arquitectura
- [CONTRIBUTING.md](../CONTRIBUTING.md) — configuración y flujo de desarrollo
- [adr/](adr/) — decisiones arquitectónicas
