import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "shared", "src");

for (const target of ["chromium", "firefox"]) {
  const extension = join(root, target);
  await mkdir(extension, { recursive: true });
  for (const file of ["capture-utils.js", "background.js", "popup.html", "popup.js", "popup.css"]) {
    await cp(join(source, file), join(extension, file));
  }
  const manifestName = target === "chromium" ? "manifest-chromium.json" : "manifest-firefox.json";
  const manifest = JSON.parse(await readFile(join(source, manifestName), "utf8"));
  await writeFile(join(extension, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
