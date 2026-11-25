import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectTestFiles, isTestFile, runTests } from "./run-tests.ts";

describe("isTestFile", () => {
  test("matches Bun's suffix and extension rule", () => {
    expect(isTestFile("app.test.ts")).toBe(true);
    expect(isTestFile("app_test.ts")).toBe(true);
    expect(isTestFile("app.spec.ts")).toBe(true);
    expect(isTestFile("app_spec.ts")).toBe(true);
  });

  test("rejects names Bun does not run", () => {
    expect(isTestFile("app_test_extra.ts")).toBe(false);
    expect(isTestFile("app_spec_extra.ts")).toBe(false);
    expect(isTestFile("foo.specification.ts")).toBe(false);
    expect(isTestFile("notes.test.md")).toBe(false);
    expect(isTestFile("run-tests.ts")).toBe(false);
    expect(isTestFile("index.ts")).toBe(false);
    expect(isTestFile("specification.ts")).toBe(false);
  });
});

describe("collectTestFiles", () => {
  test("skips dependency, build, and hidden directories", () => {
    const root = mkdtempSync(join(tmpdir(), "mcp-toys-"));
    try {
      mkdirSync(join(root, "node_modules", "pkg"), { recursive: true });
      writeFileSync(join(root, "node_modules", "pkg", "left.test.ts"), "");
      mkdirSync(join(root, "dist"));
      writeFileSync(join(root, "dist", "out.test.ts"), "");
      mkdirSync(join(root, "out"));
      writeFileSync(join(root, "out", "built.test.ts"), "");
      mkdirSync(join(root, "coverage"));
      writeFileSync(join(root, "coverage", "cov.test.ts"), "");
      mkdirSync(join(root, ".git"));
      writeFileSync(join(root, ".git", "hook.test.ts"), "");
      mkdirSync(join(root, ".hidden"));
      writeFileSync(join(root, ".hidden", "secret.test.ts"), "");
      mkdirSync(join(root, "scripts"));
      writeFileSync(join(root, "scripts", "app.test.ts"), "");

      const found = collectTestFiles(root).map((file) => file.replaceAll("\\", "/"));
      expect(found).toEqual([join(root, "scripts", "app.test.ts").replaceAll("\\", "/")]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("runTests", () => {
  test("returns 0 when the directory has no tests", async () => {
    const root = mkdtempSync(join(tmpdir(), "mcp-toys-empty-"));
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(" "));
    };
    try {
      expect(await runTests(root)).toBe(0);
      expect(lines).toEqual(["test: no test files"]);
    } finally {
      console.log = original;
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("returns 1 when the root directory cannot be read", async () => {
    const root = mkdtempSync(join(tmpdir(), "mcp-toys-missing-"));
    const missing = join(root, "does-not-exist");
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(" "));
    };
    try {
      expect(await runTests(missing)).toBe(1);
      expect(lines).toEqual([]);
    } finally {
      console.log = original;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
