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
