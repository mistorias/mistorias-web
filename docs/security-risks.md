# Riesgos de seguridad priorizados

> Origen: [issue #17](https://github.com/mistorias/mistorias-gestion-de-producto/issues/17)
> del repo `mistorias-gestion-de-producto`. Análisis basado en el estado
> real del repositorio `mistorias-web` a la fecha de este documento.

## Resumen ejecutivo

El monitor de Netlify registró requests desde varios países a paths
inexistentes (`/.env`, `/.git/config`, `/wp-includes/wlwmanifest.xml`,
`/actuator/env`, `/xmlrpc.php`, `/.well-known/acme-challenge/*`,
`/graphql`, `/server-status`, entre otros), todos respondidos con 301 o
404. Este patrón corresponde a **escaneo automatizado masivo de internet**
(bots que prueban rutas genéricas de WordPress, Git, Spring Actuator,
Docker registry, credenciales `.env`, etc. contra cualquier dominio
público), no a un ataque dirigido específicamente contra mistorias-web.

`mistorias-web` es un sitio **100% estático** construido con Astro
(`astro@^7.1.6`, sin adapter, sin SSR, sin `netlify/functions/`, sin
`src/pages/api/**`). Netlify solo sirve archivos de `dist/`. Por eso la
gran mayoría de las rutas escaneadas **no son explotables**: no existe
código de servidor que las procese, y responden 404 porque simplemente no
hay ningún archivo en esa ruta.

El riesgo real no está en "vulnerabilidades explotadas", sino en:

1. Que el dominio/cuenta de Netlify/cuenta de GitHub sean el objetivo de
   secuestro (coincide con la preocupación explícita del issue).
2. La ausencia de headers de seguridad HTTP defensivos.
3. Higiene operativa: `robots.txt`, doble pipeline de despliegue,
   dependencias.
4. Falta de visibilidad continua sobre estos intentos (hoy es revisión
   manual del dashboard).

## Metodología

Se cruzó la lista de paths escaneados (aportada por el equipo desde el
dashboard de Netlify) con un inventario del repositorio: `astro.config.mjs`,
ausencia de `netlify.toml`/`public/_headers`, workflows de CI/CD en
`.github/workflows/`, `package.json`, y el único punto de procesamiento de
contenido (`src/lib/content/content-loader.ts`).

## Riesgos priorizados

### 1. Secuestro de dominio / cuenta Netlify / cuenta GitHub (Alto)

Es la preocupación explícita del issue ("apropiarse del dominio"). Si un
atacante compromete la cuenta de Netlify, la cuenta de GitHub, o el
registrador del dominio `mistorias.pe`, puede redirigir todo el tráfico del
sitio sin necesidad de explotar ninguna vulnerabilidad de la aplicación.

**Recomendación**: habilitar MFA en Netlify y GitHub, revisar el lock del
registrador de dominio, auditar quién tiene acceso a
`NETLIFY_AUTH_TOKEN` (usado en `.github/workflows/deploy-netlify.yml`) y a
los secrets del repositorio, y limitar el número de personas con permisos
de administrador.

### 2. Ausencia de headers de seguridad HTTP (Medio-Alto)

No existe `netlify.toml` ni `public/_headers` en el repo: el sitio no
envía `Content-Security-Policy`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` ni
`X-Frame-Options`. Corresponde a OWASP Top 10 **A05:2021 – Security
Misconfiguration**.

**Recomendación**: agregar `public/_headers` (o `netlify.toml`) con estos
headers como parte de las buenas prácticas de Netlify para sitios
estáticos.

### 3. Doble superficie pública: Netlify + GitHub Pages (Medio)

Además del despliegue a Netlify (`deploy-netlify.yml`, dominio
`mistorias.pe`), existe un segundo pipeline (`deploy-github-pages.yml`)
que publica el mismo contenido en `mistorias.github.io/mistorias-web` en
cada push a `main`. Esto duplica la superficie pública expuesta y puede
generar contenido desincronizado entre ambos dominios.

**Recomendación**: evaluar si GitHub Pages sigue siendo necesario; si es
solo un entorno de desarrollo/preview, documentarlo como tal o retirarlo.

### 4. Falta de `robots.txt` (Bajo)

No existe `public/robots.txt`. Mencionado explícitamente en el issue.
Impacto de seguridad bajo, pero es una práctica estándar para sitios
estáticos y ayuda a controlar qué rutas se indexan.

**Recomendación**: agregar un `robots.txt` básico.

### 5. Cadena de suministro / dependencias (Bajo)

El árbol de dependencias es pequeño (`astro`, `@astrojs/check` como deps
directas; `typescript`, `vitest`, `@types/node` como dev), con lockfile de
pnpm presente. El riesgo actual es bajo, pero no hay automatización de
auditoría.

**Recomendación**: agregar `pnpm audit` a CI y/o habilitar Dependabot para
detectar vulnerabilidades conocidas en dependencias. Corresponde a OWASP
**A06:2021 – Vulnerable and Outdated Components**.

### 6. Falta de visibilidad continua (Bajo-Medio)

Hoy la detección de estos escaneos depende de revisión manual del
dashboard de Netlify. No hay alertas automáticas ante cambios de patrón
(por ejemplo, un `200` inesperado en una ruta sensible en vez de `404`).

**Recomendación**: formalizar una revisión periódica del dashboard o
configurar alertas si Netlify lo permite en el plan actual.

### 7. Riesgo de contenido — ya mitigado (Informativo)

El único punto de procesamiento de "contenido externo" es
`src/lib/content/content-loader.ts`, que lee archivos `.md` locales del
repo en tiempo de build (no en runtime, no viene de usuarios finales).
Ya valida el frontmatter contra un schema (`storySchema.parse`) y rechaza
HTML crudo tanto en frontmatter como en el body (`assertNoRawHtml`). Este
control ya está implementado y no requiere acción adicional.

## Riesgos descartados (no aplican a este sitio)

Las siguientes rutas escaneadas por los bots **no representan una
vulnerabilidad explotable** en mistorias-web, porque el sitio no tiene
backend/runtime que las procese — Netlify simplemente responde 404 al no
encontrar el archivo:

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

| Categoría | Aplica | Notas |
|---|---|---|
| A01 Broken Access Control | No | No hay autenticación ni rutas protegidas |
| A02 Cryptographic Failures | Parcial | HTTPS gestionado por Netlify; no hay datos sensibles en el sitio |
| A03 Injection | No | No hay backend, base de datos ni inputs de usuario procesados en runtime |
| A04 Insecure Design | No | Alcance del sitio no requiere controles adicionales |
| A05 Security Misconfiguration | **Sí** | Ver riesgo #2 (headers) |
| A06 Vulnerable and Outdated Components | **Sí** | Ver riesgo #5 (dependencias) |
| A07 Identification and Authentication Failures | No | No hay sistema de autenticación |
| A08 Software and Data Integrity Failures | **Sí** | Mitigado por `pnpm install --frozen-lockfile` y actions pineadas por hash en CI; mantener esta práctica |
| A09 Security Logging and Monitoring Failures | **Sí** | Ver riesgo #6 (visibilidad continua) |
| A10 Server-Side Request Forgery | No | No hay backend que haga requests salientes |

## Próximos pasos recomendados

1. Habilitar MFA en Netlify y GitHub; revisar lock del dominio.
2. Agregar `public/_headers` con headers de seguridad.
3. Decidir el futuro del pipeline de GitHub Pages.
4. Agregar `robots.txt`.
5. Automatizar `pnpm audit` / Dependabot en CI.
6. Definir un proceso de revisión periódica del dashboard de Netlify.

Este documento cubre el análisis y la priorización; la implementación de
estas recomendaciones queda fuera del alcance de este entregable.
