# mcp-toys monorepo 骨架设计

日期：2026-11-25

本仓库做成 TypeScript + Bun workspaces 的 monorepo，用来放多个独立的 MCP server 和少量共享库。这一轮只搭骨架，不写 server 代码，也不建共享包。

## 已确认的决定

- 运行时、包管理、测试都用 Bun。本机版本是 1.4.2，`packageManager` 钉死为 `bun@1.4.2`。CI 用同一个版本。
- 目录：`servers/<短横线名>/` 放 MCP server，`packages/<短横线名>/` 放共享库。两边目前只有 `.gitkeep`。
- 包名与目录名相同，不加 npm scope。例如 `servers/weather` 的 `name` 是 `weather`。根包名是 `mcp-toys`。根包和以后每个包都设 `private: true`。这一轮不配置发布。
- 包之间用 `workspace:*` 互引。
- 规范执行到「标准」：Biome 格式化并检查；Lefthook 在提交前处理暂存文件；GitHub Actions 在推送到 `main` 和所有 pull request 时跑检查和测试。不加 Turbo、Nx、commitlint。
- 文档分成三份：`README.md` 只写项目说明和命令；`CONTRIBUTING.md` 写给人看的规范；`AGENTS.md` 写给 AI 助手的同一套约束。
- `LICENSE` 保持现有 Apache 2.0，不改。
- `.idea/` 不进仓库。

## 仓库布局

```
mcp-toys/
├── .github/workflows/ci.yml
├── .editorconfig
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── biome.json
├── CONTRIBUTING.md
├── lefthook.yml
├── LICENSE
├── package.json
├── bun.lock
├── README.md
├── tsconfig.json
├── tsconfig.base.json
├── packages/.gitkeep
├── scripts/run-tests.ts
└── servers/.gitkeep
```

`bun.lock` 由 `bun install` 生成并提交。

## 根 package.json

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

版本用脱字号范围。`bun install` 解析出的具体版本写进 `bun.lock`。

`prepare` 在 `bun install` 之后执行 `lefthook install`。CI 里这次安装只写入该次 checkout 的 `.git/hooks`。`bun install` 的退出码必须是 0，其中包含 `prepare`。

## TypeScript

`tsconfig.base.json` 只放编译选项，没有 `include` 或 `files`。以后每个包的 tsconfig 继承它。

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

未使用的局部变量和参数交给 Biome，避免和 `tsc` 报两遍。不开启 JSX。

根 `tsconfig.json` 继承基线，并检查现有 TypeScript：

```json
{
  "extends": "./tsconfig.base.json",
  "include": ["scripts", "servers", "packages"],
  "exclude": ["**/node_modules", "**/dist"]
}
```

TypeScript 7.0.2 在 `files` 为空时会以 TS18002 失败。根配置因此必须至少包含 `scripts/run-tests.ts`。`servers/` 和 `packages/` 里暂时只有 `.gitkeep`，不影响这次检查。

`bun run typecheck` 就是 `tsc -p tsconfig.json --noEmit`，退出码与 `tsc` 相同。

## 测试脚本

Bun 1.4.2 在仓库里没有任何测试文件时打印 `No tests found!` 并以退出码 1 结束。直接把 `bun test` 放进 CI，空仓库会红。

`scripts/run-tests.ts` 负责保住「空仓库也能过」：

- 跳过 `node_modules`、`dist`、`out`、`coverage`、`.git`。
- 文件名包含 `.test`、`_test_`、`.spec` 或 `_spec_` 时，把它当作测试文件。这与 Bun 1.4.2 的发现规则一致。
- 一个都没有：打印 `test: no test files`，退出码 0。
- 有测试文件：在仓库根目录、以继承的标准输入输出执行 `bun test`，退出码与该进程相同。
- 禁止改成执行 `bun run test`，否则会递归调用自己。

`package.json` 的 `test` 脚本调用这个文件。CI 执行 `bun run test`。

## Biome

使用 Biome 2.6 的配置形状。格式化、推荐 lint、以及 assist 里的 `organizeImports` 都打开。

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

`bun.lock` 被排除，避免 Biome 去解析锁文件。已被 `.gitignore` 忽略的文件不再检查。

## EditorConfig 与换行

`.editorconfig`：

- `root = true`
- 全部文件：UTF-8、LF、文件末尾换行、去掉行尾空白、空格缩进、宽度 2
- `*.md`：保留行尾空白，避免打断 Markdown 的硬换行

`.gitattributes`：

```
* text=auto eol=lf
```

## .gitignore

用下面这份替换现有的 Node 框架模板。`bun.lock` 不忽略。

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

## Lefthook

只在 `pre-commit` 跑 Biome。不在提交前跑类型检查或测试。

```yaml
pre-commit:
  commands:
    check:
      glob: "*.{js,jsx,ts,tsx,json,jsonc,css}"
      run: bunx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
```

`stage_fixed: true` 会把 Biome 改过的暂存文件重新 `git add`。没有匹配文件时，这条命令被跳过，提交继续。

钩子依赖 PATH 里的 `bun`。Windows 上由 Lefthook 2 调用 Git 自带的 shell 执行。

## GitHub Actions

文件：`.github/workflows/ci.yml`。

- 触发：推送到 `main`，以及所有 pull request。
- 运行环境：`ubuntu-latest`。
- 步骤：
  1. `actions/checkout@v4`
  2. `oven-sh/setup-bun@v2`，不额外传版本。该 action 默认读取 `package.json` 的 `packageManager`，因此装到 Bun 1.4.2。
  3. `bun install --frozen-lockfile`
  4. `bun run check`
  5. `bun run test`

功能分支上的普通 push 不单独跑 CI，只在打开或更新 pull request 时跑。直接推送到 `main` 会跑。

## 文档

三份文档都用简体中文。`CONTRIBUTING.md` 是规范的正文。`AGENTS.md` 用祈使句列出同一套规则，方便助手执行。两份同时改，不能各写各的。

### README.md

只包含：

- 这是存放多个独立 MCP server 和少量共享库的 monorepo。
- 需要 Bun 1.4.2，以 `packageManager` 为准。
- 命令：`bun install`、`bun run check`、`bun run format`、`bun run typecheck`、`bun run test`。每条命令用一句话说明结果。
- 规范见 `CONTRIBUTING.md`。
- 许可证是 Apache 2.0。

不在 README 里重复目录约定和钩子细节。

### CONTRIBUTING.md

包含：

- `servers/` 与 `packages/` 的职责。
- 包名等于目录名，`private: true`，内部依赖写 `workspace:*`。新建包之前先查这个无作用域名字；若它已经指向 npm 上的另一个包，就换一个更具体的名字。
- 新增一个 server 的步骤。这些步骤写进 `CONTRIBUTING.md`，这一轮的实现不按步骤去创建 server：
  1. 建立 `servers/<短横线名>/`
  2. 写 `package.json`：`name` 为目录名，`private: true`，`type: module`
  3. 写 `tsconfig.json`，继承 `../../tsconfig.base.json`
  4. 需要别的工作区包时，依赖版本写 `workspace:*`
  5. 在仓库根执行 `bun install`
- 格式和检查用 Biome：2 空格、行宽 100、LF、双引号。提交前 Lefthook 会对暂存文件执行 `biome check --write` 并重新暂存。
- CI 在 `main` 的 push 和所有 pull request 上运行 `bun run check` 与 `bun run test`。
- 提交 `bun.lock`。不提交 `.idea/`、`.vscode/`、`.env`。许可证文件保持 Apache 2.0。
- 说明空仓库时 `bun run test` 由 `scripts/run-tests.ts` 以 0 退出；一旦出现符合 Bun 规则的测试文件，就改为执行真正的 `bun test`。

### AGENTS.md

用祈使句写下，并与 CONTRIBUTING 一致：

- 使用 TypeScript 和 Bun 1.4.2。安装、运行、测试都用 Bun。
- MCP server 放在 `servers/<短横线名>/`，共享库放在 `packages/<短横线名>/`。
- 包名与目录名相同，不加 scope，并设 `private: true`。工作区依赖使用 `workspace:*`。
- 新包的 tsconfig 继承根上的 `tsconfig.base.json`。
- 新增 server 或共享库时按 `CONTRIBUTING.md` 的步骤做，不要把 server 放到 `packages/`。
- 用 Biome 格式化和检查，不手改格式来对抗 Biome。
- 提交 `bun.lock`。不提交 `.idea/`、`.vscode/` 和 `.env`。
- 不要主动加入 Turbo、Nx、commitlint、Husky、ESLint、Prettier 或发布配置。
- 不修改 `LICENSE`。

## 这一轮不做的事

- 不创建示例 MCP server，不创建共享包的实现代码。
- 不加 Turbo、Nx、commitlint、Husky、ESLint、Prettier。
- 不写发布配置，不注册 npm scope。
- 不修改 `LICENSE`。
- 不把 `.idea/` 提交进 git。

## 完成标准

在仓库根执行下面的命令，且全部退出码为 0：

1. `bun install`
2. `bun run check`
3. `bun run test`
4. `bun run format`（再跑一次 `bun run check`，仍然为 0）

`bun install` 之后，`.git/hooks` 里存在 Lefthook 安装的 `pre-commit`。`git status` 里除了预期的新文件和 `bun.lock`，没有 `.idea/`。
