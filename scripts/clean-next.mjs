import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const nextDir = join(root, ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
} else {
  console.log("No .next to remove");
}

/** Clears persistent webpack/turbo caches that can cause `__webpack_modules__[moduleId] is not a function` after HMR flakes (esp. Windows). */
const webpackCache = join(root, "node_modules", ".cache");
if (existsSync(webpackCache)) {
  rmSync(webpackCache, { recursive: true, force: true });
  console.log("Removed node_modules/.cache");
}
