# Políticas de seguridad

## Reportando una vulnerabilidad

**No reportes vulnerabilidades de seguridad mediante un issue o PR
público.** Un issue público expone el detalle del hallazgo antes de que
exista una corrección.

Usa el reporte privado de GitHub:

1. Ve a la pestaña **Security** de este repositorio.
2. Selecciona **Report a vulnerability**.
3. Describe el hallazgo con el mayor detalle posible (pasos para
   reproducir, impacto, componente afectado).

Responderemos lo antes posible para evaluar y priorizar el reporte.

## Alcance

Este sitio es una aplicación estática (sin backend, sin autenticación, sin
formularios que reciban datos de usuarios). Hallazgos de escaneo genérico
contra rutas típicas de otros stacks (WordPress, `.git`, `.env`, paneles de
administración, APIs, etc.) generalmente no aplican, ya que no existe
código de servidor que las procese. Aun así, repórtalos si tienes dudas.

## Fuera de alcance

- Reportes de fuerza bruta o escaneo automatizado sin evidencia de una
  vulnerabilidad concreta explotable.
- Ataques de denegación de servicio.
- Ingeniería social contra mantenedores o colaboradores.
