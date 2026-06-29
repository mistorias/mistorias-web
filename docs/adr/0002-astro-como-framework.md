# ADR 0002: Uso de Astro como framework del sitio web de Mistorias

## Estado

Aceptado

## Contexto

El sitio web es el espacio narrativo principal. Se priorizan:

- Publicación sostenible de contenido editorial semanal (blog-first).
- Trazabilidad y transparencia: fuentes visibles, contexto claro,
  historial de cambios auditables — valores explícitos de la marca.
- Extensibilidad hacia un dashboard de datos abiertos en el futuro.
- Coste operativo mínimo (en lo posible nulo).
- Flujo de contribución abierto alineado con la vocación comunitaria
  y participativa de Mistorias.
- El desarrollador principal tiene perfil JS/Node; no tiene
  experiencia previa con PHP o WordPress.

Se evaluaron tres alternativas:

| Alternativa                       | Razón de descarte                                                                                                                                                  |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| WordPress                         | Requiere PHP; overhead de aprendizaje sin beneficio técnico; coste de hosting no gratuito en niveles adecuados; menos control sobre la trazabilidad del contenido. |
| Ghost                             | Plataforma cerrada para contenido; modelo de contribución vía PR no es nativo; coste mensual en tier managed.                                                      |
| Astro (estático + Vercel/Netlify) | Seleccionado — ver decisión.                                                                                                                                       |

## Decisión

Se usa **Astro** como framework del sitio, desplegado en **Vercel o Netlify**
(free tier), con contenido gestionado como archivos Markdown en Git.

Las razones técnicas y de marca que sostienen esta decisión son:

1. **Alineación con la transparencia de marca.** Mistorias asume la
   transparencia como principio core: contexto claro, fuentes visibles,
   trazabilidad entre historia, dato e interpretación. Git como sistema
   de versionado del contenido hace ese principio auditable y
   verificable por cualquier colaborador o lector técnico.

2. **Content Collections para el modelo editorial.** Astro Content
   Collections permiten definir un esquema tipado para los pilares de
   contenido de Mistorias (historia humana, dato explicado, contexto y
   reflexión), forzando que todo post incluya al menos dos de los tres
   pilares — regla editorial establecida en la guía de marca.

3. **Multiautor y contribución abierta.** La vocación comunitaria de
   Mistorias requiere que el flujo de contribución sea abierto. Astro
   permite gestionar autores como archivos en `src/content/authors/` y
   aceptar contribuciones vía fork → PR → merge → auto-deploy, sin
   necesitar plataforma de login adicional.

4. **Soporte nativo de internacionalización.** La audiencia principal
   es hispanohablante (Arequipa, Perú, América Latina). El español es
   el idioma canónico. Un campo `lang` en el esquema de contenido con
   prefijos de ruta (`/es/`, `/en/`, `/pt/`) permite añadir traducciones
   cuando la capacidad lo permita, sin rediseño estructural.

5. **Extensibilidad hacia el dashboard de datos.** El mismo codebase
   Astro puede crecer para integrar componentes interactivos de datos
   (islas de React, Svelte o Vue), evitando migración de plataforma
   cuando Mistorias evolucione hacia algo más sofisticado.

6. **Coste cero de infraestructura.** Hosting en Vercel o Netlify free tier.
   El coste total de la iniciativa se mantiene bajo o nulo
   (dominio + privacidad WHOIS), dentro del presupuesto objetivo.

## Consecuencias

### Positivas

- El contenido vive en Git: trazabilidad completa de cada historia,
  corrección o dato publicado — coherente con el principio de
  transparencia de Mistorias.
- El esquema de Content Collections actúa como contrato editorial:
  un post no puede publicarse sin cumplir la estructura mínima de
  los pilares de contenido.
- Despliegue continuo automático: merge en rama principal → sitio
  actualizado en el proveedor de hosting sin intervención manual.
- Coste de infraestructura nulo mientras el tráfico sea < 100 GB/mes
  de transferencia (límite Vercel/Netlify free).
- La base de código es reutilizable para un dashboard de datos abiertos
  sin cambio de plataforma.

### Costos

- Astro requiere conocimiento de JS/Node para personalización avanzada
  (aceptable dado el perfil del equipo).
- Las contribuciones de contenido requieren familiaridad básica con Git
  y Markdown; se mitiga con un `CONTRIBUTING.md` que documente el flujo
  y el tono editorial de Mistorias.
- El contenido dinámico (comentarios, búsqueda, formularios) requiere
  servicios externos o islas interactivas; no es bloqueante para el MVP.

## Testing

Se recomienda añadir `tests/content-flow.spec.ts` con fixtures válidas
e inválidas para verificar:

- Que un post con los tres pilares de contenido pasa la validación.
- Que un post sin campo `lang` usa español como valor por defecto.
- Que un post sin bloques básicos en frontmatter lanza un
  error tipado en build time.

El comando objetivo de validación es `pnpm astro check && pnpm test`.

## Notas operativas iniciales

- El repositorio del sitio debe vivir bajo la organización GitHub de
  Mistorias (`github.com/mistorias`), no bajo cuentas personales,
  coherente con el modelo de marca independiente del fundador.
- El nombre de marca canónico es **Mistorias**. Cualquier referencia a
  nombres alternativos de campaña (e.g. nombres geográficos locales)
  es un alias de distribución, no reemplaza la identidad de marca.
- La plataforma de dominio (Namecheap o IONOS) y la configuración de
  privacidad WHOIS se definen fuera de este ADR.
- La decisión sobre la gestión de contenido (submodule vs. monorepo)
  se tratará en un ADR separado.