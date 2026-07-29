import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");
const standaloneNext = path.join(standaloneRoot, ".next");

await mkdir(standaloneNext, { recursive: true });

for (const [source, destination] of [
  [path.join(root, ".next", "static"), path.join(standaloneNext, "static")],
  [path.join(root, "public"), path.join(standaloneRoot, "public")],
]) {
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
}

console.log("Prepared standalone static and public assets.");
