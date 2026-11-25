import { type Dirent, readdirSync } from "node:fs";
import { join } from "node:path";

const SKIP_DIRS: ReadonlySet<string> = new Set(["node_modules", "dist", "out", "coverage", ".git"]);

export function isTestFile(filename: string): boolean {
  return (
    filename.includes(".test") ||
    filename.includes("_test_") ||
    filename.includes(".spec") ||
    filename.includes("_spec_")
  );
}

export function collectTestFiles(root: string): string[] {
  const found: string[] = [];

  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          continue;
        }
        walk(join(dir, entry.name));
        continue;
      }

      if (entry.isFile() && isTestFile(entry.name)) {
        found.push(join(dir, entry.name));
      }
    }
  };

  walk(root);
  return found;
}

export async function runTests(root: string): Promise<number> {
  const files = collectTestFiles(root);
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
