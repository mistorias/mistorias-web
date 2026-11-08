import type { CommentPullRequest } from "./comment-pull-request";
import {
  CONTENT_BRANCH,
  githubError,
  githubRequest,
  REPOSITORY_URL,
  type FetchLike
} from "./github-api";

/**
 * Tope de PR de comentarios abiertos a la vez. Acota el daño máximo de un
 * ataque: lo que pase de aquí sigue en el panel privado de Netlify (ADR 0036).
 */
export const MAX_OPEN_COMMENT_PULL_REQUESTS = 15;

const COMMENT_BRANCH_PREFIX = "comentarios/";

export type OpenCommentResult =
  | { status: "opened"; number: number }
  | { status: "duplicate" }
  | { status: "queue-full" };

async function jsonOrThrow<Body>(response: Response, ok: number): Promise<Body> {
  if (response.status !== ok) {
    throw githubError(response);
  }
  return (await response.json()) as Body;
}

async function openCommentPullRequestCount(
  fetchImpl: FetchLike,
  token: string
): Promise<number> {
  const pulls = await jsonOrThrow<{ head: { ref: string } }[]>(
    await githubRequest(
      fetchImpl,
      token,
      "GET",
      `${REPOSITORY_URL}/pulls?state=open&per_page=100`
    ),
    200
  );
  return pulls.filter((pull) => pull.head.ref.startsWith(COMMENT_BRANCH_PREFIX))
    .length;
}

/**
 * Abre el PR de un comentario con cinco llamadas: cola, commit de `main`,
 * rama, archivo y PR (la sexta, el token, la hace quien la invoca). Si la rama
 * ya existe (422) el comentario ya se envió antes: no se abre otro PR.
 */
export async function openCommentPullRequest(options: {
  fetch: FetchLike;
  token: string;
  pullRequest: CommentPullRequest;
}): Promise<OpenCommentResult> {
  const { fetch: fetchImpl, token, pullRequest } = options;

  if (
    (await openCommentPullRequestCount(fetchImpl, token)) >=
    MAX_OPEN_COMMENT_PULL_REQUESTS
  ) {
    return { status: "queue-full" };
  }

  const ref = await jsonOrThrow<{ object: { sha: string } }>(
    await githubRequest(
      fetchImpl,
      token,
      "GET",
      `${REPOSITORY_URL}/git/ref/heads/${CONTENT_BRANCH}`
    ),
    200
  );

  const created = await githubRequest(fetchImpl, token, "POST", `${REPOSITORY_URL}/git/refs`, {
    ref: `refs/heads/${pullRequest.branch}`,
    sha: ref.object.sha
  });
  if (created.status === 422) {
    return { status: "duplicate" };
  }
  if (created.status !== 201) {
    throw githubError(created);
  }

  await jsonOrThrow(
    await githubRequest(
      fetchImpl,
      token,
      "PUT",
      `${REPOSITORY_URL}/contents/${pullRequest.path}`,
      {
        message: pullRequest.commitMessage,
        content: Buffer.from(pullRequest.contents).toString("base64"),
        branch: pullRequest.branch
      }
    ),
    201
  );

  const pull = await jsonOrThrow<{ number: number }>(
    await githubRequest(fetchImpl, token, "POST", `${REPOSITORY_URL}/pulls`, {
      title: pullRequest.title,
      head: pullRequest.branch,
      base: CONTENT_BRANCH,
      body: pullRequest.body
    }),
    201
  );

  return { status: "opened", number: pull.number };
}
