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
