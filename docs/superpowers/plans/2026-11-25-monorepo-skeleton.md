# Monorepo Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 mcp-toys 搭成只含骨架的 TypeScript + Bun workspaces monorepo，使 `bun install`、`bun run check`、`bun run test`、`bun run format` 在没有 MCP server 源码时全部成功。

**Architecture:** 根包是 private workspace。`servers/` 与 `packages/` 先只放 `.gitkeep`。TypeScript 基线放在 `tsconfig.base.json`，根 `tsconfig.json` 检查 `scripts/`、`servers/`、`packages/`。`scripts/run-tests.ts` 在没有测试文件时退出 0，有测试文件时在仓库根执行 `bun test`。Biome 负责格式和 lint，Lefthook 在提交前处理暂存文件，GitHub Actions 在 `main` 的 push 和所有 pull request 上跑同一套检查。

**Tech Stack:** Bun 1.4.2、TypeScript 7.0.2、@biomejs/biome 2.6.9、@types/bun 1.4.5、Lefthook 2.2.2、GitHub Actions `actions/checkout@v4` 与 `oven-sh/setup-bun@v2`

## Global Constraints

- `packageManager` 必须是 `bun@1.4.2`。安装、运行、测试都用 Bun。
- 根包名 `mcp-toys`，`"private": true`，`"type": "module"`，workspaces 为 `servers/*` 与 `packages/*`。
- 依赖范围：`@biomejs/biome` `^2.6.9`，`@types/bun` `^1.4.5`，`lefthook` `^2.2.2`，`typescript` `^7.0.2`。
- 不创建示例 MCP server，不创建共享包实现，不加 Turbo、Nx、commitlint、Husky、ESLint、Prettier，不写发布配置。
- 不修改 `LICENSE`。不把 `.idea/`、`.vscode/`、`node_modules/` 提交进 git。提交 `bun.lock`。
- 包名约定只写进文档：包名等于目录名，无 scope，`private: true`，内部依赖用 `workspace:*`。
- 文档用简体中文。`README.md` 只留项目说明和命令。规范正文在 `CONTRIBUTING.md`。`AGENTS.md` 用祈使句复述同一套规则。
- 提交信息用英文祈使句。PowerShell 下用 `git commit -m "..."`。不要使用 `git add -i`。不要提交 `.env`。

---

### Task 1: 忽略规则与编辑器默认值

**Files:**
- Modify: `.gitignore`
- Create: `.editorconfig`
- Create: `.gitattributes`
- Create: `servers/.gitkeep`
- Create: `packages/.gitkeep`

**Interfaces:**
- Consumes: 无
- Produces: `.gitignore` 忽略 `.idea/`、`.vscode/`、`node_modules/`、`dist/`、`out/`、`coverage/`、`.env`，并且不忽略 `bun.lock` 与 `.env.example`

- [ ] **Step 1: 用下面的内容替换 `.gitignore`**

```
node_modules/

dist/
out/
*.tsbuildinfo

.env
.env.*
!.env.example

logs/
*.log
coverage/
.nyc_output/

.cache/
.biome/
.bun/

.DS_Store
Thumbs.db

.idea/
.vscode/
*.swp
```

- [ ] **Step 2: 写入 `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: 写入 `.gitattributes`**

```
* text=auto eol=lf
```

- [ ] **Step 4: 创建两个空的 `.gitkeep`**

`servers/.gitkeep` 与 `packages/.gitkeep` 都是空文件。

- [ ] **Step 5: 验证忽略规则**

Run:

```powershell
git check-ignore -v -- .idea .vscode .env node_modules dist coverage
```

Expected: 退出码 0。每一行都指向 `.gitignore`。

Run:

```powershell
git check-ignore -v -- bun.lock .env.example; Write-Output "exit:$LASTEXITCODE"
```

Expected: 无忽略输出，`exit:1`。

- [ ] **Step 6: Commit**

```powershell
git add .gitignore .editorconfig .gitattributes servers/.gitkeep packages/.gitkeep docs/superpowers/specs/2026-11-25-monorepo-skeleton-design.md docs/superpowers/plans/2026-11-25-monorepo-skeleton.md
git commit -m "Set repository ignore rules and editor defaults."
```

---

### Task 2: 根包、TypeScript 基线与 Lefthook

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `lefthook.yml`
- Create: `bun.lock`（由 `bun install` 生成）

**Interfaces:**
- Consumes: Task 1 的 `.gitignore`，这样 `node_modules/` 不会进 git
- Produces: 脚本名 `check`、`format`、`typecheck`、`test`、`prepare`。`typecheck` 执行 `tsc -p tsconfig.json --noEmit`。`test` 执行 `bun scripts/run-tests.ts`。`prepare` 执行 `lefthook install`。根 tsconfig 的 include 是 `scripts`、`servers`、`packages`。

- [ ] **Step 1: 写入 `package.json`**

```json
{
  "name": "mcp-toys",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.4.2",
  "workspaces": ["servers/*", "packages/*"],
  "scripts": {
    "check": "biome check . && bun run typecheck",
    "format": "biome check --write .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "bun scripts/run-tests.ts",
    "prepare": "lefthook install"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.6.9",
    "@types/bun": "^1.4.5",
    "lefthook": "^2.2.2",
    "typescript": "^7.0.2"
  }
}
```

- [ ] **Step 2: 写入 `tsconfig.base.json`**

不要加 `include` 或 `files`。

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "types": ["bun"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

- [ ] **Step 3: 写入 `tsconfig.json`**

```json
{
  "extends": "./tsconfig.base.json",
  "include": ["scripts", "servers", "packages"],
  "exclude": ["**/node_modules", "**/dist"]
}
```

- [ ] **Step 4: 写入 `lefthook.yml`**

必须在 `bun install` 之前写好，`prepare` 才会成功。

```yaml
pre-commit:
  commands:
    check:
      glob: "*.{js,jsx,ts,tsx,json,jsonc,css}"
      run: bunx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
```

- [ ] **Step 5: 安装依赖**

Run:

```powershell
bun install
```

Expected: 退出码 0。生成 `bun.lock`。`.git/hooks/pre-commit` 存在。

这一步结束时还没有 `scripts/run-tests.ts`。不要运行 `bun run typecheck`，TypeScript 7 会因为没有输入文件而报 TS18002。

- [ ] **Step 6: Commit**

```powershell
git add package.json tsconfig.base.json tsconfig.json lefthook.yml bun.lock
git commit -m "Add the Bun workspace manifest and TypeScript baseline."
```

---

### Task 3: 测试入口

**Files:**
- Create: `scripts/run-tests.test.ts`
- Create: `scripts/run-tests.ts`
- Test: `scripts/run-tests.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `package.json` 脚本 `test` = `bun scripts/run-tests.ts`，以及已安装的 Bun 1.4.2
- Produces:
  - `isTestFile(filename: string): boolean`
  - `collectTestFiles(root: string): string[]`
  - `runTests(root: string): Promise<number>`
  - 直接执行该文件时，用 `import.meta.dir` 的上一级作为仓库根调用 `runTests`，再 `process.exit`

- [ ] **Step 1: 写入失败的测试 `scripts/run-tests.test.ts`**

```typescript
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
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
```

- [ ] **Step 2: 运行测试，确认它失败**

Run:

```powershell
bun test scripts/run-tests.test.ts
```

Expected: 退出码非 0。输出里能看到找不到 `./run-tests.ts`。

- [ ] **Step 3: 写入 `scripts/run-tests.ts`**

```typescript
import { readdirSync, type Dirent } from "node:fs";
import { join } from "node:path";

const SKIP_DIRS: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  "out",
  "coverage",
  ".git",
]);

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
```

不要改成 `bun run test`。那会递归调用 `package.json` 里的 `test` 脚本。

- [ ] **Step 4: 运行测试和类型检查**

Run:

```powershell
bun test scripts/run-tests.test.ts
```

Expected: 退出码 0，3 个 describe 全部通过。

Run:

```powershell
bun run typecheck
```

Expected: 退出码 0。

Run:

```powershell
bun run test
```

Expected: 退出码 0。因为仓库里已经有 `scripts/run-tests.test.ts`，输出是 `bun test` 的通过结果，而不是 `test: no test files`。空目录行为由 `runTests` 的单元测试覆盖。

- [ ] **Step 5: Commit**

```powershell
git add scripts/run-tests.ts scripts/run-tests.test.ts
git commit -m "Add a test runner that succeeds when the repo has no tests."
```

---

### Task 4: Biome

**Files:**
- Create: `biome.json`
- Modify: 被 `bun run format` 改写的已跟踪文件

**Interfaces:**
- Consumes: Task 2 的 `check` 与 `format` 脚本，Task 3 的 TypeScript 文件
- Produces: `biome check .` 对当前仓库退出码 0。`bun.lock` 不参与检查。

- [ ] **Step 1: 写入 `biome.json`**

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!bun.lock"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

- [ ] **Step 2: 格式化并检查**

Run:

```powershell
bun run format
bun run check
```

Expected: 两条命令退出码都是 0。

如果 `format` 改写了源文件，把那些改动留在工作区，跟 `biome.json` 一起提交。

- [ ] **Step 3: Commit**

```powershell
git add biome.json scripts/run-tests.ts scripts/run-tests.test.ts package.json tsconfig.json tsconfig.base.json
git commit -m "Check formatting and lint with Biome."
```

只添加 `format` 实际改过的文件。未改动的文件不必强行加入。

---

### Task 5: GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 2 的 `packageManager`、`check`、`test`，Task 4 已经能通过的 `bun run check`
- Produces: 推送到 `main` 或打开任意 pull request 时，在 `ubuntu-latest` 上依次执行 `bun install --frozen-lockfile`、`bun run check`、`bun run test`

- [ ] **Step 1: 写入 `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run check
      - run: bun run test
```

`setup-bun@v2` 不传 `bun-version`。它默认读取 `package.json` 的 `packageManager`，因此使用 Bun 1.4.2。

- [ ] **Step 2: 确认本地检查仍然通过**

Run:

```powershell
bun run check
bun run test
```

Expected: 两条命令退出码都是 0。本机不执行 GitHub Actions。

- [ ] **Step 3: Commit**

```powershell
git add .github/workflows/ci.yml
git commit -m "Run check and test on push to main and on pull requests."
```

---

### Task 6: README、CONTRIBUTING 与 AGENTS

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: 前面任务已经固定的命令、目录、版本和钩子行为
- Produces: 三份中文文档。`CONTRIBUTING.md` 是规范正文。`AGENTS.md` 不增加与它矛盾的规则。

- [ ] **Step 1: 写入 `README.md`**

```markdown
# mcp-toys

存放多个独立 MCP server 和少量共享库的 monorepo。

需要 [Bun](https://bun.sh) 1.4.2。版本以根目录 `package.json` 的 `packageManager` 为准。

## 命令

在仓库根目录执行：

- `bun install`：安装依赖，并安装提交前钩子。
- `bun run check`：运行 Biome 检查和 TypeScript 类型检查。
- `bun run format`：用 Biome 格式化并写回文件。
- `bun run typecheck`：只做 TypeScript 类型检查。
- `bun run test`：运行测试。还没有任何测试文件时，命令成功并打印 `test: no test files`。

开发规范见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

Apache License 2.0。详见 [LICENSE](LICENSE)。
```

- [ ] **Step 2: 写入 `CONTRIBUTING.md`**

```markdown
# 开发规范

## 目录

- `servers/<短横线名>/` 放一个独立的 MCP server。
- `packages/<短横线名>/` 放共享库。
- 不要把 MCP server 放到 `packages/`。

## 包

包名与目录名相同，不加 npm scope。`servers/weather` 的包名是 `weather`。每个包都设 `private: true`。

工作区里的包互相依赖时，版本写 `workspace:*`。

新建包之前先查看这个无作用域名字。如果它已经指向 npm 上的另一个包，就换一个更具体的名字。

## 新增一个 server

1. 建立 `servers/<短横线名>/`。
2. 写 `package.json`：`name` 为目录名，`private` 为 `true`，`type` 为 `module`。
3. 写 `tsconfig.json`，继承 `../../tsconfig.base.json`。
4. 需要别的工作区包时，依赖版本写 `workspace:*`。
5. 在仓库根目录执行 `bun install`。

## 格式与检查

Biome 使用 2 个空格、行宽 100、LF 和双引号。

提交前，Lefthook 对暂存文件执行 `biome check --write`，并把改过的文件重新暂存。提交前不跑类型检查和测试。钩子要求 PATH 里有 `bun`。

推送到 `main`，以及所有 pull request，会在 GitHub Actions 里运行 `bun run check` 和 `bun run test`。

## 测试

没有任何符合 Bun 规则的测试文件时，`bun run test` 由 `scripts/run-tests.ts` 打印 `test: no test files` 并以 0 退出。出现文件名包含 `.test`、`_test_`、`.spec` 或 `_spec_` 的文件后，它改为在仓库根目录执行 `bun test`。

## 应当提交的文件

提交 `bun.lock`。不要提交 `.idea/`、`.vscode/` 和 `.env`。

许可证文件保持 Apache 2.0，不要修改 `LICENSE`。
```

- [ ] **Step 3: 写入 `AGENTS.md`**

```markdown
# 给 AI 助手的规则

- 使用 TypeScript 和 Bun 1.4.2。安装、运行、测试都用 Bun。
- MCP server 放在 `servers/<短横线名>/`，共享库放在 `packages/<短横线名>/`。
- 包名与目录名相同，不加 scope，并设 `private: true`。工作区依赖使用 `workspace:*`。
- 新包的 tsconfig 继承根上的 `tsconfig.base.json`。
- 新增 server 或共享库时按 `CONTRIBUTING.md` 的步骤做，不要把 server 放到 `packages/`。
- 用 Biome 格式化和检查，不要手改格式来对抗 Biome。
- 提交 `bun.lock`。不要提交 `.idea/`、`.vscode/` 和 `.env`。
- 不要主动加入 Turbo、Nx、commitlint、Husky、ESLint、Prettier 或发布配置。
- 不要修改 `LICENSE`。
```

- [ ] **Step 4: 格式化文档并复查**

Run:

```powershell
bun run format
bun run check
bun run test
```

Expected: 三条命令退出码都是 0。若 Biome 改写了 Markdown，把改动留在工作区。

- [ ] **Step 5: Commit**

```powershell
git add README.md CONTRIBUTING.md AGENTS.md
git commit -m "Document the workspace layout and development rules."
```

如果 `format` 还改了其他已跟踪文件，把那些文件一并加入这次提交。

---

### Task 7: 按 spec 的完成标准复查

**Files:**
- 无新增文件。只在前序任务漏掉生成物时补交。

**Interfaces:**
- Consumes: Task 1 到 Task 6 的全部文件
- Produces: spec「完成标准」一节里的四条命令都退出码为 0

- [ ] **Step 1: 跑完成标准**

Run:

```powershell
bun install
bun run check
bun run test
bun run format
bun run check
```

Expected: 五条命令退出码都是 0。

- [ ] **Step 2: 确认钩子、许可证和 IDE 目录**

Run:

```powershell
Test-Path .git/hooks/pre-commit
git diff -- LICENSE
git status --short
```

Expected:

- `Test-Path` 输出 `True`。
- `git diff -- LICENSE` 没有输出。
- `git status --short` 不出现 `.idea/`。若还有未提交的格式化改动，提交它们：

```powershell
git add -u
git commit -m "Apply the final Biome formatting."
```

没有剩余改动时，不要创建空提交。
