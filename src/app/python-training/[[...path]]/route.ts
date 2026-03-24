import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const trainingRoot = resolve(process.cwd(), "python-training");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ipynb": "application/x-ipynb+json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

export const dynamic = "force-dynamic";

function buildFilePath(pathParts: string[] | undefined) {
  const requestedParts = pathParts && pathParts.length > 0 ? pathParts : ["index.html"];
  const requestedPath = resolve(trainingRoot, ...requestedParts);
  const safeRoot = `${trainingRoot}${sep}`;

  if (requestedPath !== trainingRoot && !requestedPath.startsWith(safeRoot)) {
    return null;
  }

  return requestedPath;
}

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  const filePath = buildFilePath(path);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const body = await readFile(filePath);
    const extension = extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] ?? "application/octet-stream";

    return new Response(body, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-type": contentType,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
