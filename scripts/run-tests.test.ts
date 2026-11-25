import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectTestFiles, isTestFile, runTests } from "./run-tests.ts";

describe("isTestFile", () => {
	test("matches Bun discovery tokens", () => {
		expect(isTestFile("app.test.ts")).toBe(true);
		expect(isTestFile("app_test_extra.ts")).toBe(true);
		expect(isTestFile("app.spec.ts")).toBe(true);
		expect(isTestFile("app_spec_extra.ts")).toBe(true);
	});

	test("rejects the runner and ordinary source files", () => {
		expect(isTestFile("run-tests.ts")).toBe(false);
		expect(isTestFile("index.ts")).toBe(false);
		expect(isTestFile("specification.ts")).toBe(false);
	});
});

describe("collectTestFiles", () => {
	test("skips dependency and build directories", () => {
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
			mkdirSync(join(root, "scripts"));
			writeFileSync(join(root, "scripts", "app.test.ts"), "");

			const found = collectTestFiles(root).map((file) =>
				file.replaceAll("\\", "/"),
			);
			expect(found).toEqual([
				join(root, "scripts", "app.test.ts").replaceAll("\\", "/"),
			]);
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
});
