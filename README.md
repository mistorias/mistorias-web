# mistorias-web

Sitio web de Mistorias construido con Astro.

**Mistorias** es una plataforma de historias que transforma la educación a través de narrativas, datos y reflexión. Este repo contiene el código del sitio web.

El contenido editorial está separado en un repositorio dedicado: [`mistorias-contenido`](https://github.com/mistorias/mistorias-contenido), integrado como git submodule.

## Inicio Rápido

Node.js 24 (definido en `.nvmrc`) + pnpm 10.8.1 (definido en `package.json`).

```bash
pnpm install
pnpm dev      # http://localhost:4321
```

## Desarrollo

Para configurar tu entorno de desarrollo, instalar dependencias y contribuir, ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Dev Container (Docker)

Para desarrollar en un contenedor que replica el entorno de despliegue, ver sección en [CONTRIBUTING.md](CONTRIBUTING.md#desarrollo-en-docker).

## Arquitectura & Decisiones Técnicas

Para entender la arquitectura, decisiones de diseño y guía de desarrollo, ver:
- [CLAUDE.md](CLAUDE.md) — Guía rápida de arquitectura y comandos para Claude Code
- [CONTRIBUTING.md](CONTRIBUTING.md) — Guía de contribución y configuración del entorno
- [`docs/adr/`](docs/adr/) — Architectural Decision Records (decisiones técnicas documentadas)

## Contenido

El contenido editorial se gestiona en el repo separado [`mistorias-contenido`](https://github.com/mistorias/mistorias-contenido), incluido en este proyecto como git submodule en `content/mistorias-contenido/`.

Ver [CONTRIBUTING.md#contenido-por-submodulo](CONTRIBUTING.md#contenido-por-submodulo) para detalles sobre cómo contribuir contenido.
