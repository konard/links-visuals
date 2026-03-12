const port = parseInt(Bun.argv[2] || "3000", 10);

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file("." + path);
    if (await file.exists()) {
      const ext = path.substring(path.lastIndexOf("."));
      const type = MIME[ext];
      return type
        ? new Response(file, { headers: { "Content-Type": type } })
        : new Response(file);
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Static server on http://localhost:${port}`);
