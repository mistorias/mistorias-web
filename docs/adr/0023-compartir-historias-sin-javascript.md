# ADR 0023: Compartir historias sin JavaScript

## Estado

Aceptado

## Contexto

Quienes leen necesitan compartir una historia con sus contactos (issue #151). El
issue pone una condición dura: si no se puede compartir sin JavaScript, no se hace.
La CSP del sitio declara `script-src 'none'` ([ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)).

Pide cinco redes (X, Facebook, Instagram, Pinterest y LinkedIn), con el título y el
resumen de la historia. La sección debe ir fija arriba a la derecha de la ventana,
con el ícono estándar de compartir, y agrandarse un poco al pasar el puntero o al
mantener el dedo encima.

## Decisión

**Cada red es un enlace común a la URL de compartir que esa red publica.** Abrirla
es solo navegar, así que no hace falta script, la CSP no cambia y la página no carga
nada de terceros. Las URLs las arma `buildShareLinks()` en
`src/lib/social/share-links.ts`:

| Red | URL | Texto |
|---|---|---|
| X | `x.com/intent/post?text=…&url=…` | Título y resumen, recortados en palabra completa para que entren con la URL en 280 caracteres. |
| Facebook | `facebook.com/sharer/sharer.php?u=…` | No acepta texto: lee `og:title`, `og:description` y `og:image`. |
| Pinterest | `pinterest.com/pin/create/button/?url=…&media=…&description=…` | Título y resumen. `media` es la misma og:image, resuelta por `resolveOgImage()`. |
| LinkedIn | `linkedin.com/sharing/share-offsite/?url=…` | Igual que Facebook. |

**Instagram queda fuera.** No tiene una URL web para compartir. Solo se comparte
desde su app o con la Web Share API (`navigator.share`), que exige JavaScript. Un
ícono de Instagram que llevara al perfil de Mistorias prometería compartir sin
hacerlo.

**La URL compartida lleva `utm_source=<red>`**, para saber qué red trae lectores.
Es la misma convención que usa la skill `publicar-en-redes` para las publicaciones
semanales. Esa skill no vive en este repositorio.

**Un botón que despliega.** `CompartirHistoria.astro` es un `<details>` nativo, el
mismo recurso de `DatoConFuente.astro`
([ADR 0010](0010-apertura-de-portada-con-datos-verificables.md)):

- El `summary` es un aro de 44px con el ícono de compartir (cuadro con flecha hacia
  arriba). Lleva el texto «Compartir esta historia» para lector de pantalla.
- La lista de redes se muestra con un toque o con el teclado (`[open]`). Donde hay
  puntero, también al pasarlo por encima. Cerrada, se oculta con `visibility`, así
  que tampoco entra en el orden de tabulación.
- Al apuntar, la sección crece un 5% y la red señalada un 15%. Eso pasa con
  `:hover`, con `:active` (el toque sostenido) y con `:focus-visible`.
- Cada red es un `EnlaceExterno` ([ADR 0022](0022-enlaces-externos-en-pestana-nueva-con-aviso.md)).
  Su aviso de pestaña nueva se abre a la izquierda y no arriba, porque arriba tapaba
  la red anterior de la columna.

Se descartó un riel con las redes siempre visibles. Es un toque menos, pero en un
celular de 390px tapaba unos 240px del borde del texto todo el tiempo.

**`sticky` y no `fixed`.** Con `position: fixed`, al abrir la página el botón queda
encima del enlace «Acerca de» de la cabecera. Un contenedor `sticky` de alto cero,
primer hijo del artículo, empieza justo debajo de la cabecera y se pega arriba a la
derecha de la ventana al bajar. Para quien lee es el comportamiento pedido, y no
choca con la cabecera ni empuja el texto.

## Consecuencias

- Compartir no agrega script, ni CSP nueva, ni peticiones a terceros.
- Facebook y LinkedIn muestran lo que digan las etiquetas `og:*`. Si esas etiquetas
  cambian, cambia lo que se comparte.
- Facebook y LinkedIn suelen normalizar el enlace al `og:url` canónico, que no lleva
  UTM. El `utm_source` es confiable en X y Pinterest, y en esas dos puede perderse.
- Los enlaces de compartir y los de las publicaciones semanales usan el mismo
  `utm_source`, así que la analítica no distingue unos de otros.
- Si alguna red cambia su URL de compartir, se corrige solo en `share-links.ts`.
- Agregar una red requiere su URL en `share-links.ts` y su glifo en `GlifoRed.astro`.
  El tipo `ShareNetwork` obliga a hacer las dos cosas.
- Sin probar en un iPhone real: iOS Safari tiene fama de no aplicar `:active` sin un
  listener táctil, y ese listener sería JavaScript. Si se confirma, ahí la red no se
  agrandaría durante el toque sostenido. El enlace funcionaría igual.
