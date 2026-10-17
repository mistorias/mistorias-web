# ADR 0025: `/ultima` redirige con 302 a la historia más reciente, generada en build

## Estado

Aceptado

## Contexto

El [issue #170](https://github.com/mistorias/mistorias-web/issues/170) pide
una dirección corta y fija —la que se pega en la biografía de Instagram, en X
o en Linktree— que siempre lleve a la última historia publicada. Pide además:

1. Que la última historia la defina un script en tiempo de build a partir del
   orden de las historias, sin inteligencia artificial.
2. Que su nombre quede guardado en un archivo —de preferencia el mismo del
   orden—, para saber cuál es sin correr el build.
3. Que el build tome el valor de ese archivo.

Ese archivo ya existe: `data/story-order.json`, el cache del orden
cronológico de [ADR 0028](0028-cache-versionado-orden-cronologico-historias.md),
que escribe `pnpm story-order` y que el workflow diario de contenido ya
regenera antes de abrir su PR.

## Decisión

### 1. `data/story-order.json` gana el campo `latest`

`writeCache` guarda `latest` —el último id de `order`, o `null` si no hay
historias—. Se lee en el diff de cada PR de contenido sin ejecutar nada.

### 2. Una regla 302 en el `_redirects` del artefacto

```
/ultima  /historias/<id>/  302
```

- **Redirección HTTP, no página.** X, Linktree y los crawlers de vista previa
  siguen la redirección y muestran el título y el `og:image` de la historia.
  Una página con `<meta http-equiv="refresh">` respondería 200 con su propia
  vista previa, y [ADR 0018](0018-redirecciones-de-etiquetas-a-temas.md) ya
  la descartó por las mismas razones.
- **302 y no 301.** El destino cambia con cada historia nueva. Un 301 lo
  guardan en caché navegadores y buscadores, y `/ultima` seguiría llevando a
  una historia vieja.
- **Escrita en `dist/`, no en `public/_redirects`.** La integración
  `latestStoryRedirect` (`src/lib/content/latest-story-redirect-integration.ts`)
  la agrega en `astro:build:done`, después de las reglas que Astro copió desde
  `public/`. Un archivo de `public/` exigiría editarlo a mano cada semana. Como
  el workflow publica con `netlify deploy --no-build --dir=dist`, la regla
  viaja dentro del artefacto, igual que las de ADR 0018.
- **Origen y destino salen de `routes.ts`** (`latestStoryRoute`,
  `storyRoute`) con la base de Netlify; una prueba verifica que nunca lleven
  `/mistorias-web` ([issue #29](https://github.com/mistorias/mistorias-gestion-de-producto/issues/29)).

### 3. Un `latest` desfasado detiene el build

En `astro:config:setup` —que corre en `astro dev` y en `astro build`— la
integración compara `latest` con la historia más reciente según las fechas
(`readStoryDates` + `orderStoriesByDate`, lo mismo que usa el script). Si no
coinciden, o el archivo no existe, falla con el mensaje
"Run `pnpm story-order` and commit the result".

Es la decisión contraria a la de `resolveNeighbors` (ADR 0028), que ante un
cache desfasado recalcula en silencio. La diferencia es deliberada: la
navegación anterior/siguiente se recalcula sin consecuencias, pero si el build
recalculara `latest`, el archivo dejaría de ser la fuente de verdad que pide
el issue; y si lo usara sin verificar, `/ultima` llevaría a la historia de la
semana pasada sin que nada fallara —la misma clase de error silencioso del
issue #29.

### 4. La portada usa el mismo desempate

`sortByDateDescending` (`src/lib/stories.ts`) desempata por id, al revés que
`orderStoriesByDate`. Así, si dos historias comparten fecha, la destacada de
la portada y el destino de `/ultima` siguen siendo la misma historia.

### 5. GitHub Pages devuelve 404

Ahí `_redirects` viaja inerte, con la misma asimetría aceptada en ADR 0018:
los enlaces que se comparten en redes son de mistorias.pe.

## Consecuencias

- Agregar una historia sin correr `pnpm story-order` rompe `pnpm dev` y
  `pnpm build` con un mensaje que dice qué hacer. El workflow de contenido ya
  lo corre, así que solo afecta a cambios hechos a mano.
- No hay página `/ultima` en el build: el sitemap no la ve y no hace falta
  filtrarla.
- Comprobación después de un release: `curl -I https://mistorias.pe/ultima`
  debe responder `302` con un `Location` a la historia.
