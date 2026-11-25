import { type Dirent, readdirSync } from "node:fs";
import { join } from "node:path";

const SKIP_DIRS: ReadonlySet<string> = new Set(["node_modules", "dist", "out", "coverage"]);

const TEST_EXTENSIONS: ReadonlySet<string> = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "mts",
  "cts",
]);

const TEST_STEM_SUFFIXES: readonly string[] = [".test", "_test", ".spec", "_spec"];

export function isTestFile(filename: string): boolean {
  const extensionStart = filename.lastIndexOf(".");
  if (extensionStart <= 0) {
    return false;
  }

  const extension = filename.slice(extensionStart + 1);
  if (!TEST_EXTENSIONS.has(extension)) {
    return false;
  }

  const stem = filename.slice(0, extensionStart);
  return TEST_STEM_SUFFIXES.some((suffix) => stem.endsWith(suffix));
}

export function collectTestFiles(root: string): string[] {
  const found: string[] = [];

  const walk = (dir: string, isRoot: boolean): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (isRoot) {
        throw error;
      }
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) {
          continue;
        }
        walk(join(dir, entry.name), false);
        continue;
      }

      if (entry.isFile() && isTestFile(entry.name)) {
        found.push(join(dir, entry.name));
      }
    }
  };

  walk(root, true);
  return found;
}

export async function runTests(root: string): Promise<number> {
  let files: string[];
  try {
    files = collectTestFiles(root);
  } catch {
    return 1;
  }

  if (files.length === 0) {
    console.log("test: no test files");
    return 0;
  }

  const proc = Bun.spawn(["bun", "test"], {
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return proc.exited;
}

if (import.meta.main) {
  const root = join(import.meta.dir, "..");
  process.exit(await runTests(root));
}
