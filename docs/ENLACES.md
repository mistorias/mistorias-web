# Enlaces

Cómo se escriben y arman los enlaces en Mistorias, para no repetir esta
guía en cada PR o issue que toque uno. Referencia completa:
[Smashing Magazine — Designing Better Links For Websites And Emails](https://www.smashingmagazine.com/2021/12/designing-better-links-websites-emails-guideline/).

## Texto del enlace

- **Descriptivo, nunca "click aquí" ni "leer más" a secas.** Quien navega por
  teclado o lector de pantalla suele saltar de enlace en enlace, o pedir la
  lista completa de enlaces de la página fuera de su contexto visual. El texto
  debe decir adónde lleva sin depender de lo que lo rodea.
- **Corto en pantalla, completo para quien lo necesita.** Cuando el mismo
  enlace se repite muchas veces en una lista o grilla (por ejemplo, una tarjeta
  de historia por cada historia), el texto visible puede ser breve y genérico
  ("Leer la historia") si el contexto que falta se agrega con una clase
  `.sr-only` (ver `src/styles/base.css`) — visible solo para quien usa lector
  de pantalla, sin repetir el título completo en cada tarjeta de la grilla.

## Un solo enlace accesible por tarjeta

Cuando una tarjeta entera debe ser clicable (imagen, título, resumen — todo
lleva al mismo lugar), **no se envuelve cada parte en su propio `<a>`**: eso
duplica el mismo destino varias veces para quien navega por lista de enlaces.
En su lugar:

1. Un único `<a>` real, con texto descriptivo, en algún punto de la tarjeta.
2. Se estira sobre toda la tarjeta con un `::after` (`position: absolute;
   inset: 0;`), sobre un contenedor `position: relative`. El clic en cualquier
   parte de la tarjeta navega igual, sin JavaScript.
3. Si la tarjeta tiene además algún enlace real a otro destino (por ejemplo,
   una ficha de tema), ese elemento necesita `position: relative; z-index: 1;`
   para no quedar tapado por el `::after` estirado.

`src/components/TarjetaHistoria.astro` es la implementación de referencia de
este patrón (issue #41); `src/components/ListaTemas.astro` es el ejemplo del
punto 3. El razonamiento completo está en
[ADR 0015](adr/0015-tarjeta-como-enlace-unico-accesible.md).

## Enlaces internos

Nunca se escribe un `href` interno a mano: `base` cambia según el destino de
despliegue (GitHub Pages vs. Netlify). Se arma siempre con los helpers de
`src/lib/routes.ts` — ver [CLAUDE.md](../CLAUDE.md#pages--routing).
