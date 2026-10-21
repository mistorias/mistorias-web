import { z } from "astro/zod";

export const SOCIAL_PUBLICATIONS_FILENAME = "publicaciones.json";

const socialPostSchema = z.strictObject({
  network: z.enum(["facebook", "instagram", "x"]),
  bufferId: z.string().min(1),
  status: z.enum(["publicado", "fallido"]),
  scheduledAt: z.iso.datetime({ offset: true }),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  text: z.string().min(1),
  url: z.url(),
  utmCampaign: z.string().min(1)
});

const socialPublicationsSchema = z.strictObject({
  story: z.string().min(1),
  posts: z.array(socialPostSchema)
});

function parseJson(contents: string, filePath: string): unknown {
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error(`${filePath}: ${SOCIAL_PUBLICATIONS_FILENAME} no es JSON válido.`);
  }
}

/**
 * Valida el registro de publicaciones en redes que escribe el bot de
 * mistorias-redes-sociales (ADR 0032). La web no lo renderiza; se valida
 * contra un esquema estricto para que la carpeta de una historia siga
 * admitiendo solo archivos revisados, que es lo que el gate de carpetas
 * protege desde el ADR 0005.
 */
export function assertSocialPublicationsAreValid(
  contents: string,
  folderName: string,
  filePath: string
): void {
  const result = socialPublicationsSchema.safeParse(parseJson(contents, filePath));

  if (!result.success) {
    throw new Error(
      `${filePath}: ${SOCIAL_PUBLICATIONS_FILENAME} no cumple el esquema. ${z.prettifyError(result.error)}`
    );
  }

  if (result.data.story !== folderName) {
    throw new Error(
      `${filePath}: el registro dice "${result.data.story}" pero está en la carpeta de "${folderName}".`
    );
  }
}
