type AssetContext = {
  request: Request;
  env: {
    ASSETS: {
      fetch(request: Request): Promise<Response>;
    };
  };
};

export async function onRequest(context: AssetContext) {
  const response = await context.env.ASSETS.fetch(context.request);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("text/html")) {
    return new Response("Asset not found.", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  return response;
}
