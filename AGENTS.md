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
