# ADR 0003: Riesgos de seguridad priorizados y controles aplicados

## Estado

Aceptado

## Contexto

El monitor de Netlify registró requests desde varios países a paths
inexistentes (`/.env`, `/.git/config`, `/wp-includes/wlwmanifest.xml`,
`/actuator/env`, `/xmlrpc.php`, `/.well-known/acme-challenge/*`,
`/graphql`, `/server-status`, entre otros), todos respondidos con 301 o
404 ([issue #17](https://github.com/mistorias/mistorias-gestion-de-producto/issues/17)
del repo `mistorias-gestion-de-producto`).

Este patrón corresponde a **escaneo automatizado masivo de internet** (bots
que prueban rutas genéricas de WordPress, Git, Spring Actuator, Docker
registry, credenciales `.env`, etc. contra cualquier dominio público), no a
un ataque dirigido específicamente contra mistorias-web.

`mistorias-web` es un sitio **100% estático** (Astro `^7.1.6`, sin adapter,
sin SSR, sin `netlify/functions/`, sin `src/pages/api/**`). Netlify solo
sirve archivos de `dist/`. La mayoría de las rutas escaneadas **no son
explotables**: no existe código de servidor que las procese, por eso
responden 404.

El riesgo real no está en "vulnerabilidades explotadas", sino en:

1. Que el dominio/cuenta de Netlify/cuenta de GitHub sean el objetivo de
   secuestro (preocupación explícita del issue).
2. La ausencia de headers de seguridad HTTP defensivos.
3. Higiene operativa: `robots.txt`, doble pipeline de despliegue.
4. Falta de visibilidad continua sobre estos intentos.

## Decisión

Se prioriza y se actúa sobre los riesgos según su impacto, aplicando en
este cambio los controles de bajo esfuerzo/alto impacto que son
puramente de configuración del repositorio, y dejando documentado —no
resuelto en este PR— lo que depende de configuración fuera del código
(cuentas de Netlify/GitHub, DNS).

### 1. Secuestro de dominio / cuenta Netlify / cuenta GitHub (Alto)

Es la preocupación explícita del issue ("apropiarse del dominio"). Si un
atacante compromete la cuenta de Netlify, la cuenta de GitHub, o el
registrador del dominio `mistorias.pe`, puede redirigir todo el tráfico
sin necesidad de explotar ninguna vulnerabilidad de la aplicación.

**Gestionado (ya presente en el repo antes de este ADR):**
- Los workflows de CI/CD usan `permissions: contents: read` (mínimos) y
  las GitHub Actions están pineadas por hash de commit, no por tag —
  reduce el riesgo de que una acción de terceros comprometida modifique
  el pipeline de despliegue.
- `NETLIFY_AUTH_TOKEN` se maneja como GitHub Secret, no está en texto
  plano en el repo.
- `pnpm install --frozen-lockfile` en ambos pipelines evita que una
  dependencia cambie de versión sin que el lockfile lo refleje.

**Gestionado (confirmado por el equipo el 2026-08-07):**
- MFA está habilitado en la cuenta de **GoDaddy** (registrador del dominio
  `mistorias.pe`).
- MFA está habilitado en la cuenta de **Netlify**.

**Pendiente — no verificable ni accionable desde el código del repo,
requiere acción manual del equipo en las plataformas correspondientes:**
- Confirmar que MFA está habilitado también en la organización/cuenta de
  **GitHub** que administra `mistorias-web` (no confirmado aún).
- Confirmar el estado de lock de transferencia del dominio en GoDaddy y
  de la privacidad WHOIS.
- Auditar qué personas tienen acceso de administrador a Netlify, a la
  organización GitHub, y a los secrets del repositorio, y reducirlo al
  mínimo necesario.

Este punto pasa de **riesgo abierto** a **parcialmente gestionado**: el
registrador de dominio y Netlify ya tienen MFA confirmado; GitHub y el
lock de transferencia siguen pendientes de confirmación.

### 2. Ausencia de headers de seguridad HTTP (Medio-Alto) — resuelto en este cambio

No existía `netlify.toml` ni `public/_headers`: el sitio no enviaba
`Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security` ni `X-Frame-Options`.
Corresponde a OWASP Top 10 **A05:2021 – Security Misconfiguration**.

Se agrega `public/_headers`, el mecanismo nativo de Netlify para sitios
estáticos, aplicando estos headers a todas las rutas (`/*`).

### 3. Doble superficie pública: Netlify + GitHub Pages (Medio) — riesgo abierto

Además del despliegue a Netlify (`deploy-netlify.yml`, dominio
`mistorias.pe`), existe un segundo pipeline (`deploy-github-pages.yml`)
que publica el mismo contenido en `mistorias.github.io/mistorias-web` en
cada push a `main`. Esto duplica la superficie pública expuesta.

No se retira en este cambio porque puede ser un entorno de desarrollo o
preview usado intencionalmente por el equipo; se deja como decisión
pendiente de negocio, no técnica.

### 4. Falta de `robots.txt` (Bajo) — resuelto en este cambio

No existía `public/robots.txt`, mencionado explícitamente en el issue.
Se agrega un `robots.txt` básico que permite indexación completa (no hay
contenido privado que excluir).

### 5. Cadena de suministro / dependencias (Bajo) — ya gestionado

`.github/dependabot.yml` ya está configurado con actualizaciones semanales
para el ecosistema `npm`, y `SECURITY.md` define el canal de reporte de
vulnerabilidades. No se requiere acción adicional en este cambio.

### 6. Falta de visibilidad continua (Bajo-Medio) — riesgo abierto

La detección de estos escaneos depende hoy de revisión manual del
dashboard de Netlify. No hay alertas automáticas ante cambios de patrón
(por ejemplo, un `200` inesperado en una ruta sensible en vez de `404`).
Queda como mejora futura, condicionada a lo que permita el plan de
Netlify en uso.

### 7. Riesgo de contenido — ya mitigado

`src/lib/content/content-loader.ts` procesa únicamente archivos `.md`
locales del repo en tiempo de build (no en runtime, no viene de usuarios
finales), valida el frontmatter contra un schema (`storySchema.parse`) y
rechaza HTML crudo (`assertNoRawHtml`). Documentado también en el ADR
0001. No requiere acción adicional.

## Riesgos descartados (no aplican a este sitio)

Las siguientes rutas escaneadas por los bots **no representan una
vulnerabilidad explotable**, porque el sitio no tiene backend/runtime que
las procese — Netlify responde 404 al no encontrar el archivo:

- `/.env`, `/.env.local`, `/.env.production`, `/api/.env`, `/backend/.env`
  y variantes: no hay servidor que lea variables de entorno en runtime; no
  hay archivos `.env` versionados en el repo.
- `/.git/config`, `/.git/HEAD`: el directorio `.git` no se publica en
  `dist/`.
- `/wp-includes/wlwmanifest.xml`, `/xmlrpc.php` y rutas de WordPress: el
  sitio no usa WordPress.
- `/actuator/env`, `/v2/_catalog`, `/telescope/requests`,
  `/server-status`: endpoints de Spring Boot Actuator, Docker Registry,
  Laravel Telescope y Apache — ninguno de estos frameworks/servidores está
  en uso.
- `/graphql`: no existe API GraphQL.
- `/.well-known/acme-challenge/*`: intentos de interferir con validación
  de certificados TLS; gestionados por Netlify, no por la aplicación.

Se documenta este razonamiento para que quede registrado y no se reabra la
duda ante futuros escaneos similares.

## Checklist OWASP Top 10 aplicado a un sitio estático

| Categoría | Aplica | Estado |
|---|---|---|
| A01 Broken Access Control | No | N/A — no hay autenticación ni rutas protegidas |
| A02 Cryptographic Failures | Parcial | HTTPS gestionado por Netlify; no hay datos sensibles en el sitio |
| A03 Injection | No | N/A — no hay backend, base de datos ni inputs de usuario procesados en runtime |
| A04 Insecure Design | No | N/A para el alcance actual |
| A05 Security Misconfiguration | Sí | Resuelto en este cambio (`public/_headers`) |
| A06 Vulnerable and Outdated Components | Sí | Gestionado (Dependabot semanal) |
| A07 Identification and Authentication Failures | No | N/A — no hay sistema de autenticación |
| A08 Software and Data Integrity Failures | Sí | Gestionado (`--frozen-lockfile`, actions pineadas por hash) |
| A09 Security Logging and Monitoring Failures | Sí | Abierto — ver riesgo #6 |
| A10 Server-Side Request Forgery | No | N/A — no hay backend que haga requests salientes |

## Consecuencias

### Positivas

- El sitio envía headers de seguridad estándar en todas las respuestas.
- `robots.txt` deja explícita la política de indexación.
- Queda un registro auditable de qué riesgos están gestionados, cuáles se
  resolvieron en este cambio, y cuáles siguen abiertos y por qué.

### Costos

- Los riesgos #1 (accesos a cuentas/dominio), #3 (doble pipeline) y #6
  (visibilidad continua) quedan abiertos porque requieren decisiones o
  acciones fuera del código del repositorio. Deben tratarse como
  seguimiento explícito, no asumirse como resueltos por este ADR.

## Testing

- Verificar en `dist/_headers` tras `pnpm build` que el archivo se copia
  correctamente al build de salida.
- Tras el próximo deploy a Netlify, confirmar con
  `curl -I https://mistorias.pe` que los headers configurados se envían
  en la respuesta.

## Notas operativas

- MFA en GoDaddy y Netlify confirmado por el equipo (2026-08-07). Falta
  confirmar MFA en GitHub y el estado de lock de transferencia del dominio
  para cerrar por completo el riesgo #1.
- La decisión sobre mantener o retirar el pipeline de GitHub Pages
  (riesgo #3) queda fuera del alcance de este ADR.
