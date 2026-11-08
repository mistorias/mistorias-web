import type { FormSubmittedEvent } from "@netlify/functions";
import storyOrder from "../../data/story-order.json";
import { handleFormSubmission } from "../../src/lib/comments/handle-form-submission";

/**
 * Adaptador de Netlify (ADR 0036): lee el entorno, inyecta `fetch` y el reloj
 * y entrega el envío a `src/lib/comments/`, que es donde vive la lógica y sus
 * tests. `formSubmitted` solo se dispara con envíos que Netlify Forms ya
 * verificó (sin spam ni honeypot) y va firmado, así que no se puede invocar
 * desde afuera. También recibe el formulario de «Reportar un problema»: el
 * núcleo lo descarta sin tocar la red.
 *
 * `data/story-order.json` se incrusta en el bundle al empaquetar la función:
 * sin esa lista, cualquiera podría pedir un PR para una historia inventada.
 */
export default {
  async formSubmitted(event: FormSubmittedEvent): Promise<void> {
    await handleFormSubmission({
      data: event.data,
      env: process.env,
      fetch,
      now: () => new Date(),
      publishedStoryIds: storyOrder.order,
      log: (entry) => console.info(JSON.stringify(entry))
    });
  }
};
