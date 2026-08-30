const VIEWBOX_PATTERN = /\bviewBox\s*=/i;
// `fill`/`stroke` seguidos de `=`, sin capturar `fill-rule` ni `stroke-width`:
// el guion que las distingue no calza con `\s*=`.
const FIXED_COLOR_ATTRIBUTE_PATTERN =
  /\b(?:fill|stroke)\s*=\s*["'](?!currentColor|none|inherit)[^"']*["']/i;
// El mismo color fijo, pero declarado dentro de un atributo `style`. SVGO lo
// escribe así al desarmar un `<style>` incrustado (`style="fill:#012c75"`), y
// sin esta regla el gate lo dejaba pasar: rompe el tema exactamente igual que
// el atributo, solo que por otra puerta.
const FIXED_COLOR_STYLE_PATTERN =
  /style\s*=\s*["'][^"']*\b(?:fill|stroke)\s*:\s*(?!currentColor|none|inherit)[^;"']+/i;
const SCRIPT_TAG_PATTERN = /<script\b/i;
const STYLE_TAG_PATTERN = /<style\b/i;
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i;
const FOREIGN_OBJECT_PATTERN = /<foreignObject\b/i;
const EXTERNAL_REFERENCE_PATTERN =
  /\b(?:href|xlink:href)\s*=\s*["'](?!#)[^"']*["']/i;

/**
 * Valida que un SVG pueda inyectarse en línea sin romper el tema ni la CSP.
 * El SVG entra al documento con `set:html`, así que su contenido es código:
 * nada que no sea marcado de dibujo puede colarse.
 *
 * Lo usan el símbolo de marca (`src/lib/brand/symbol-gate.ts`) y la
 * ilustración de portada (`illustration-gate.ts`), que comparten el mismo
 * contrato porque comparten la misma forma de entrar al documento.
 */
export function assertInlineSvgIsThemeReady(
  content: string,
  filePath: string
): void {
  if (!VIEWBOX_PATTERN.test(content)) {
    throw new Error(
      `${filePath} no declara viewBox. Sin viewBox recortado, el alto del dibujo deja de ser el alto visible.`
    );
  }

  if (
    FIXED_COLOR_ATTRIBUTE_PATTERN.test(content) ||
    FIXED_COLOR_STYLE_PATTERN.test(content)
  ) {
    throw new Error(
      `${filePath} usa un color fijo en vez de currentColor o de una clase que el componente pinte con un token. Así no hereda el color del documento y el tema oscuro deja de funcionar solo.`
    );
  }

  if (STYLE_TAG_PATTERN.test(content)) {
    throw new Error(
      `${filePath} trae un <style> incrustado. Inyectado con set:html se vuelve una hoja de estilos real del documento, y un currentColor ahí adentro puede resolver contra un color que la misma hoja fija, no contra el token heredado. La presentación va en atributos (fill="currentColor") o en clases que estile el componente, no en una hoja de estilos aparte.`
    );
  }

  if (
    SCRIPT_TAG_PATTERN.test(content) ||
    EVENT_HANDLER_PATTERN.test(content) ||
    FOREIGN_OBJECT_PATTERN.test(content) ||
    EXTERNAL_REFERENCE_PATTERN.test(content)
  ) {
    throw new Error(
      `${filePath} contiene contenido no permitido en un SVG que se inyecta en línea (script, manejador de evento, foreignObject o referencia externa).`
    );
  }
}
