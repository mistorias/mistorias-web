// El texto de un fragmento de HTML sin sus etiquetas: para comprobar lo que
// se lee aunque el marcado parta una frase en varios elementos.
export const visibleText = (html: string): string =>
  html.replace(/<[^>]*>/g, "");
