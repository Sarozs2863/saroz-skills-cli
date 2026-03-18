# @zsaro/skills-cli

跨平台 AI Agent Skills 管理 CLI 工具（Claude Code、OpenClaw 等），统一管理、配置化部署。

[English](./README.md)

## 为什么需要

Claude Code、OpenClaw 等 AI 编程工具使用 "skills"（markdown 文件）来教会 agent 特定能力。当 skills 越来越多，管理变得混乱：

- Skills 散落在不同目录
- 不同机器之间难以同步
- 同一个 skill 多个平台都要用
- Skill 迭代没有版本控制

**skills-cli** 通过单一事实来源 + symlink 部署解决这些问题。

## 工作原理

```
~/.saroz-skills/
├── source/              # Git 仓库（唯一事实来源）
│   ├── skills/          # 所有 skills，按分类组织
│   │   ├── claude-code/ # 平台专用
│   │   ├── openclaw/    # 平台专用
│   │   └── common/      # 跨平台共用
│   └── profiles/        # 部署配置
│       └── personal.json
├── config/              # 本地机器配置
└── state/               # 部署状态与备份
```

Skills 通过 **symlink** 部署——改一处，所有引用即时生效。无复制、无同步、无漂移。

## 安装

```bash
npm install -g @zsaro/skills-cli
```

## 快速开始

```bash
# 从已有仓库初始化
skills init https://github.com/your-user/your-skills.git

# 或从零开始
skills init

# 列出所有 skills
skills list

# 添加新 skill
skills add my-new-skill

# 部署到目标平台
skills install
```

## 命令

### `skills init [repo-url]`

初始化 skills 工作空间。

```bash
# clone 已有仓库
skills init https://github.com/user/skills.git

# 指定 profile（非交互式）
skills init https://github.com/user/skills.git --profile personal

# 从零创建
skills init
```

### `skills list`

按分类列出所有 skills。

```bash
skills list           # 只显示名称
skills list -v        # 显示详细描述
```

### `skills add <name>`

创建新 skill 骨架。

```bash
# 交互式
skills add my-skill

# 非交互式
skills add my-skill --category claude-code --target claude-code --target openclaw

# 只创建不加入 profile
skills add my-skill --category common --no-profile
```

### `skills import <path>`

从外部目录导入已有 skill。

```bash
# 交互式
skills import ~/.claude/skills/some-skill

# 非交互式
skills import ~/.claude/skills/some-skill --category claude-code --target claude-code
```

导入后原目录变为 symlink 指向仓库，现有工具继续正常工作。

### `skills install`

按当前 profile 同步部署 skills。

```bash
skills install            # 部署
skills install --dry-run  # 预览，不实际执行
```

部署过程：
1. **清场** — 删除目标目录中指向本仓库的旧 symlink
2. **部署** — 按 profile 声明创建新 symlink
3. **冲突** — 遇到同名非本仓库 skill 时询问用户

## Profile 配置

Profile 定义「哪些 skills 部署到哪个平台目录」。

```json
{
    "name": "personal",
    "description": "个人 Mac 开发环境",
    "targets": {
        "claude-code": {
            "path": "~/.claude/skills",
            "skills": ["brave-proxy", "obsidian-vault", "skills-meta"]
        },
        "openclaw": {
            "path": "~/.openclaw/skills",
            "skills": ["server-ops-guide", "skills-meta"]
        }
    }
}
```

Skills 可跨 target 共享——`skills-meta` 同时出现在 Claude Code 和 OpenClaw 中。

## Skill 结构

```
skill-name/
├── SKILL.md          # 必须：frontmatter + 指令内容
├── references/       # 可选：参考数据
├── scripts/          # 可选：脚本文件
└── sub-skills/       # 可选：子 skills
```

### SKILL.md Frontmatter

```yaml
---
name: my-skill
description: 这个 skill 做什么
requires:
  mcp: [github]          # 依赖的 MCP server
  skills: [other-skill]  # 依赖的其他 skill
  tools: [jq, git]       # 依赖的系统工具
---
```

## 设计原则

- **单一事实来源** — 一个仓库，symlink 分发
- **幂等** — `skills install` 随时可重复执行
- **非破坏性** — 冲突时询问用户，覆盖前自动备份
- **平台无关** — 适用于任何从目录读取 skills 的工具

## License

MIT
