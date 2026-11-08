import { buildCommentPullRequest } from "./comment-pull-request";
import type { FetchLike } from "./github-api";
import { createAppJwt, requestInstallationToken } from "./github-app";
import { openCommentPullRequest } from "./open-comment-pull-request";
import { parsePublicComment } from "./opinion-submission";

export type CommentsEnvironment = {
  COMMENTS_GITHUB_APP_ID?: string;
  COMMENTS_GITHUB_APP_INSTALLATION_ID?: string;
  COMMENTS_GITHUB_APP_PRIVATE_KEY?: string;
};

/** Lo único que se registra: nunca el nombre ni el texto del lector. */
export type CommentLogEntry =
  | { event: "comment-skipped"; reason: string }
  | { event: "comments-misconfigured" }
  | { event: "comment-opened"; story: string; pr: number }
  | { event: "comment-duplicate"; story: string }
  | { event: "comment-queue-full"; story: string }
  | { event: "comment-failed"; story: string; reason: string };

type Options = {
  data: Record<string, string | undefined>;
  env: CommentsEnvironment;
  fetch: FetchLike;
  now: () => Date;
  publishedStoryIds: readonly string[];
  log: (entry: CommentLogEntry) => void;
};

// El mensaje de un error de red podría arrastrar texto ajeno; solo los
// nuestros (`github-<estado>`) se registran tal cual y el resto, por su tipo.
function failureReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message.startsWith("github-") ? error.message : error.name;
  }
  return "unknown";
}

/**
 * Atiende un envío de Netlify Forms (ADR 0036). Los envíos que no son
 * comentarios públicos válidos terminan antes de cualquier llamada de red,
 * y nada lanza: el envío ya quedó guardado en el panel de Netlify y un fallo
 * aquí no debe perderlo ni reintentarlo en bucle.
 */
export async function handleFormSubmission(options: Options): Promise<void> {
  const { env, log } = options;
  const parsed = parsePublicComment(
    options.data,
    options.publishedStoryIds,
    options.now()
  );

  if ("skipped" in parsed) {
    log({ event: "comment-skipped", reason: parsed.skipped });
    return;
  }

  const appId = env.COMMENTS_GITHUB_APP_ID;
  const installationId = env.COMMENTS_GITHUB_APP_INSTALLATION_ID;
  const privateKey = env.COMMENTS_GITHUB_APP_PRIVATE_KEY;
  if (!appId || !installationId || !privateKey) {
    log({ event: "comments-misconfigured" });
    return;
  }

  const { story } = parsed.comment;

  try {
    const jwt = createAppJwt(
      appId,
      privateKey,
      Math.floor(options.now().getTime() / 1000)
    );
    const token = await requestInstallationToken({
      fetch: options.fetch,
      jwt,
      installationId
    });
    const result = await openCommentPullRequest({
      fetch: options.fetch,
      token,
      pullRequest: buildCommentPullRequest(parsed.comment)
    });

    if (result.status === "opened") {
      log({ event: "comment-opened", story, pr: result.number });
    } else if (result.status === "duplicate") {
      log({ event: "comment-duplicate", story });
    } else {
      log({ event: "comment-queue-full", story });
    }
  } catch (error) {
    log({ event: "comment-failed", story, reason: failureReason(error) });
  }
}
