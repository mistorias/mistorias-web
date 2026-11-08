import { createHash } from "node:crypto";

/**
 * Id determinista del comentario: sha256 de historia, nombre y texto,
 * truncado a 16 hexadecimales. Que sea determinista vuelve idempotente a la
 * función: un doble envío da el mismo nombre de rama y se deduplica solo.
 * Se serializa como JSON para que no importe dónde termina un campo y
 * empieza el siguiente.
 */
export function commentId(story: string, author: string, text: string): string {
  return createHash("sha256")
    .update(JSON.stringify([story, author, text]))
    .digest("hex")
    .slice(0, 16);
}
