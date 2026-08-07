import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacySite = join(repositoryRoot, "site");
const hostedOutput = join(repositoryRoot, "tmp", "hosted-site");
const visionBuild = await mkdtemp(join(tmpdir(), "armature-building-vision-"));

const hostedIndex = `<link rel="canonical" href="https://armaturelab.org/building-vision" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Building Vision · armature" />
    <meta property="og:description" content="A finish-only before-and-after vision for the HSR Founders Club café and Armature Lab." />
    <meta property="og:url" content="https://armaturelab.org/building-vision" />
    <meta property="og:image" content="https://armaturelab.org/building-vision/after/01-building-frontage.png" />
    <meta name="twitter:card" content="summary_large_image" />`;

try {
  await rm(hostedOutput, { force: true, recursive: true });
  await mkdir(hostedOutput, { recursive: true });
  await cp(legacySite, hostedOutput, { recursive: true });

  process.env.BUILDING_VISION_STANDALONE = "1";
  await build({
    root: repositoryRoot,
    build: { emptyOutDir: true, outDir: visionBuild }
  });

  const visionOutput = join(hostedOutput, "building-vision");
  await mkdir(visionOutput, { recursive: true });
  await cp(join(visionBuild, "assets"), join(visionOutput, "assets"), { recursive: true });
  await cp(join(visionBuild, "building-vision", "before"), join(visionOutput, "before"), { recursive: true });
  await cp(join(visionBuild, "building-vision", "after"), join(visionOutput, "after"), { recursive: true });

  for (const icon of ["apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"]) {
    await cp(join(visionBuild, icon), join(visionOutput, icon));
  }

  const generatedIndex = await readFile(join(visionBuild, "index.html"), "utf8");
  const buildingVisionIndex = generatedIndex
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      '<meta name="description" content="A finish-only before-and-after vision for the HSR Founders Club café and Armature Lab." />'
    )
    .replace("<title>armature · The Physical AI and Robotics Lab</title>", `${hostedIndex}\n    <title>Building Vision · armature</title>`);
  await writeFile(join(visionOutput, "index.html"), buildingVisionIndex);

  await writeFile(
    join(hostedOutput, "_redirects"),
    "/building-vision /building-vision/index.html 200\n"
  );

  const [sourceHomepage, hostedHomepage] = await Promise.all([
    readFile(join(legacySite, "index.html")),
    readFile(join(hostedOutput, "index.html"))
  ]);
  if (!sourceHomepage.equals(hostedHomepage)) {
    throw new Error("The hosted build changed the legacy homepage.");
  }
  if (!buildingVisionIndex.includes('/building-vision/assets/')) {
    throw new Error("The Building Vision bundle is not rooted at /building-vision.");
  }
} finally {
  await rm(visionBuild, { force: true, recursive: true });
}
