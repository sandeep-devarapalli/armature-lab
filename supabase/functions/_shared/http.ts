import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "request_failed",
  ) {
    super(message);
  }
}

export function json(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    return json(
      request,
      { error: error.code, message: error.message },
      error.status,
    );
  }

  console.error(error);
  return json(
    request,
    { error: "internal_error", message: "The request could not be completed." },
    500,
  );
}

export async function parseJson<T>(rawBody: string): Promise<T> {
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.", "invalid_json");
  }
}
