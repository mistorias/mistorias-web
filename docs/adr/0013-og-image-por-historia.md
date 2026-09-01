# ADR 0013: `og:image` por historia, generado con `astro:assets`, no con el Image CDN de Netlify

## Estado

Aceptado

## Contexto

El sitio emitía `og:title`, `og:description` y `og:url`, pero nunca `og:image`
(issue #39): al compartir un enlace, la vista previa sale sin imagen. Es la
única etiqueta Open Graph que faltaba, y la que más pesa: la ilustración
risograph de marca ([ADR 0012](0012-ilustracion-de-portada.md)) y las fotos de
cabecera de cada historia son el diferenciador visual más fuerte del proyecto,
y hoy ninguna llega a compartirse.

El issue pedía apuntar `og:image` a la cabecera 16:9 de cada historia, servida
en 1200×630 "vía Netlify Image CDN (`@astrojs/netlify`)", más una imagen por
defecto para páginas sin cabecera propia.

## Decisión

### 1. El recorte corre en el build con `astro:assets`, no con el Image CDN de Netlify

El sitio se construye una sola vez y se publica en dos destinos
(`DEPLOY_TARGET`, ver CLAUDE.md § Build Variants): GitHub Pages y Netlify. El
Image CDN de Netlify solo existe en el segundo — instalar `@astrojs/netlify`
serviría `og:image` ahí y dejaría GitHub Pages sin imagen, exactamente el
problema que este issue busca cerrar, y reintroduciría la misma clase de bug
—un destino publicado con lo que solo vale para el otro— que el issue #29
(ver CLAUDE.md § Build Variants) ya obligó a blindar.

`TarjetaHistoria.astro` y la página de historia ya recortan `principal.jpg`
con `<Picture>` vía `astro:assets` (Sharp) — corre en el build, es idéntico en
ambos destinos y no depende de qué host sirve el HTML. `getImage()` es la
misma API sin el componente alrededor: `src/lib/social/og-image.ts` la usa
para producir el recorte 1200×630 en `ogImageFromStoryImage()`.

### 2. La imagen por defecto se pre-genera una vez, no en cada build

Página sin cabecera propia (portada, temas, acerca, una historia sin
`principal.jpg`) cae a `defaultOgImage()`, que apunta a
`public/imagenes/og-default.jpg`. Ese archivo no sale de `astro:assets`: lo
genera `scripts/generate-default-og-image.ts` (`pnpm og-default-image`) y se
versiona en git, mismo patrón que `data/story-order.json`
(`docs/adr/0012-cache-versionado-orden-cronologico-historias.md`) — un
artefacto commiteado en vez de recalculado, porque no depende de contenido
editorial y solo cambiaría si cambia la ilustración de marca.

El contenido de esa imagen es la ilustración de portada
(`src/assets/ilustraciones/planta-de-libros.svg`) rasterizada sobre el fondo
de marca. Esa ilustración vive pensada para inyectarse en línea con
`set:html` dentro de una página real: sus dos tintas son `class="ink-base"`
(`fill: currentColor`) y `class="ink-acento"` (`fill: var(--color-analitico)`)
— resueltas por el `<style>` de `PlantaDeLibros.astro`, no por el archivo
SVG. Rasterizada aparte con Sharp no hay cascada CSS que resolver, así que el
script sustituye ambas clases por los hexadecimales que `tokens.css` usa en
**modo claro** antes de convertir a PNG y componerla sobre un lienzo
1200×630. Se fija a claro a propósito: una vista previa de enlace no hereda
`prefers-color-scheme` de quien la mira, y una tarjeta social ilegible en la
mitad de los casos es peor que una que no varía.

### 3. `og:image` requiere `Astro.site`, igual que `og:url`

Facebook y X necesitan una URL absoluta para `og:image`. `BaseLayout.astro`
ya arma `urlCanonica` condicionada a `Astro.site` (ausente en los tests de
Container, ver CLAUDE.md § Limitaciones); `og:image` sigue el mismo patrón:
sin `Astro.site` no hay origen contra el cual absolutizar, así que la etiqueta
no se emite. En cualquier build real (los dos `DEPLOY_TARGET`) `site` siempre
está definido, así que la etiqueta siempre sale.

## Consecuencias

- El sitio sigue sin ninguna dependencia de Netlify más allá de `netlify.toml`
  (comando y `DEPLOY_TARGET`): `og:image` funciona igual en los dos destinos.
- `og:image:width`, `og:image:height` y `og:image:alt` van siempre junto con
  `og:image`, más `twitter:card=summary_large_image` para que el validador de
  X no necesite `twitter:image` aparte.
- Si `principal.jpg` cambia, su recorte de `og:image` se regenera solo en el
  siguiente build, igual que las demás variantes que ya emite `astro:assets`.
  Si la ilustración de portada cambia, hace falta correr
  `pnpm og-default-image` a mano y comitear el resultado — no hay gate que lo
  fuerce, como sí lo hay para `principal.jpg`
  ([ADR 0005](0005-imagenes-en-historias.md)).
