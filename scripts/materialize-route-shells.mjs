import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const legacyDirectoryRoutes = ["building-vision", "projects"];
const source = path.resolve("dist/index.html");

await Promise.all(
  legacyDirectoryRoutes.map(async (route) => {
    const directory = path.resolve("dist", route);
    await mkdir(directory, { recursive: true });
    await copyFile(source, path.join(directory, "index.html"));
  })
);
