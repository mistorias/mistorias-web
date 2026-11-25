// Extensiones `.ts` explícitas: ver la nota en generate-story-order-cache.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { readCache } from "../src/lib/content/story-order-cache.ts";
import { fetchOpinionSubmissions } from "../src/lib/ratings/netlify-forms.ts";
import { RATINGS_FILE_PATH } from "../src/lib/ratings/ratings-file.ts";
import {
  buildRatingsPullRequestBody,
  updateRatings
} from "../src/lib/ratings/update-ratings.ts";

// Es el mismo sitio que despliega deploy-netlify.yml; el id es público.
const NETLIFY_SITE_ID = "42257747-3665-453a-9fe6-2c0bbc3bcacf";

/**
 * Actualiza `data/ratings.json` con las calificaciones de Netlify Forms (ADR
 * 0037). Lo corre el workflow `actualizar-calificaciones` cada día.
 *
 * Uso:
 *   NETLIFY_FORMS_TOKEN=… pnpm ratings
 *
 * Variables:
 *   NETLIFY_FORMS_TOKEN     token personal de Netlify (obligatorio)
 *   NETLIFY_SITE_ID         otro sitio, solo para pruebas
 *   RATINGS_PR_BODY_FILE    si existe, dónde escribir la descripción del PR
 */
async function main(): Promise<void> {
  const token = process.env.NETLIFY_FORMS_TOKEN;

  if (!token) {
    throw new Error("Falta NETLIFY_FORMS_TOKEN: es el token personal de Netlify con el que se leen los envíos.");
  }

  const publishedStoryIds = readCache()?.order;

  if (publishedStoryIds === undefined) {
    throw new Error("No se pudo leer data/story-order.json: sin él no se sabe qué historias están publicadas. Corre `pnpm story-order`.");
  }

  const submissions = await fetchOpinionSubmissions({
    token,
    siteId: process.env.NETLIFY_SITE_ID || NETLIFY_SITE_ID
  });

  const update = updateRatings({
    previousContents: readFileSync(RATINGS_FILE_PATH, "utf8"),
    submissions,
    publishedStoryIds
  });

  if (update.changed) {
    writeFileSync(RATINGS_FILE_PATH, update.contents);
  }

  const bodyFile = process.env.RATINGS_PR_BODY_FILE;

  if (bodyFile) {
    writeFileSync(bodyFile, buildRatingsPullRequestBody(update.rows));
  }

  console.log(
    update.changed
      ? `${RATINGS_FILE_PATH} actualizado: ${update.rows.length} historia(s) con cambios (${submissions.length} envíos leídos).`
      : `${RATINGS_FILE_PATH} ya está al día (${submissions.length} envíos leídos). Nada que hacer.`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
