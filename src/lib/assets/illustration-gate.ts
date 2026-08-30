import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertInlineSvgIsThemeReady } from "./inline-svg-gate";

export const defaultIllustrationPath = path.resolve(
  process.cwd(),
  "src/assets/ilustraciones/planta-de-libros.svg"
);

/**
 * Las dos tintas del dibujo. No llevan color propio: el componente pinta
 * `ink-base` con `currentColor` e `ink-acento` con `--color-analitico`, que es
 * lo que permite servir ambos temas desde un solo archivo.
 */
export const INK_CLASSES = ["ink-base", "ink-acento"] as const;

const inkClassPattern = (inkClass: string): RegExp =>
  new RegExp(`class\\s*=\\s*["'][^"']*\\b${inkClass}\\b`, "i");

/**
 * Valida la ilustración de portada, que se inyecta en línea igual que el
 * símbolo de marca. Al contrato común le suma el suyo: que las dos clases de
 * tinta sigan ahí.
 *
 * Sin esa comprobación, reexportar el dibujo desde la herramienta de diseño
 * —que es como llegó la primera vez, con los colores metidos en un `<style>`—
 * compila sin quejarse y publica una ilustración que en modo oscuro queda
 * negra sobre Deep Slate. El gate lo convierte en un build roto, que es un
 * problema mucho más barato.
 */
export function assertIllustrationIsThemeReady(
  content: string,
  filePath: string
): void {
  assertInlineSvgIsThemeReady(content, filePath);

  for (const inkClass of INK_CLASSES) {
    if (!inkClassPattern(inkClass).test(content)) {
      throw new Error(
        `${filePath} no declara la clase "${inkClass}". Sin ella ese trazo no recibe su token y el dibujo deja de adaptarse al tema.`
      );
    }
  }
}

export async function assertIllustrationFileIsThemeReady(
  filePath: string = defaultIllustrationPath
): Promise<void> {
  const content = await readFile(filePath, "utf8");
  assertIllustrationIsThemeReady(content, filePath);
}
