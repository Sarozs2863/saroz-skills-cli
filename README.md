# @zsaro/skills-cli

A CLI tool for managing AI agent skills across multiple platforms (Claude Code, OpenClaw, etc.) with unified source of truth and profile-based deployment.

[中文文档](./README.zh-CN.md)

## Why

AI coding agents like Claude Code and OpenClaw use "skills" — markdown files that teach the agent specific capabilities. Managing these skills across multiple machines and platforms becomes messy:

- Skills scattered across different directories
- No easy way to sync between machines
- Same skill needed by multiple platforms
- No version control for skill iterations

**skills-cli** solves this by providing a single source of truth with symlink-based deployment.

## How It Works

```
~/.saroz-skills/
├── source/              # Git repo (source of truth)
│   ├── skills/          # All skills, organized by category
│   │   ├── claude-code/ # Platform-specific
│   │   ├── openclaw/    # Platform-specific
│   │   └── common/      # Shared across platforms
│   └── profiles/        # Deployment configs
│       └── personal.json
├── config/              # Local machine config
└── state/               # Deploy state & backups
```

Skills are deployed via **symlinks** — edit once, effective everywhere. No copy, no sync, no drift.

## Install

```bash
npm install -g @zsaro/skills-cli
```

## Quick Start

```bash
# Initialize from existing repo
skills init https://github.com/your-user/your-skills.git

# Or start fresh
skills init

# List all skills
skills list

# Add a new skill
skills add my-new-skill

# Deploy skills to target platforms
skills install
```

## Commands

### `skills init [repo-url]`

Initialize the skills workspace.

```bash
# Clone existing skills repo
skills init https://github.com/user/skills.git

# Clone with specific profile (non-interactive)
skills init https://github.com/user/skills.git --profile personal

# Create empty workspace from scratch
skills init
```

### `skills list`

List all available skills grouped by category.

```bash
skills list           # Names only
skills list -v        # With descriptions
```

### `skills add <name>`

Create a new skill with scaffold.

```bash
# Interactive
skills add my-skill

# Non-interactive
skills add my-skill --category claude-code --target claude-code --target openclaw

# Create without adding to profile
skills add my-skill --category common --no-profile
```

### `skills import <path>`

Import an existing skill from an external directory.

```bash
# Interactive
skills import ~/.claude/skills/some-skill

# Non-interactive
skills import ~/.claude/skills/some-skill --category claude-code --target claude-code
```

The original directory is replaced with a symlink pointing back to the repository, so existing tools continue to work.

### `skills install`

Sync deploy skills according to the current profile.

```bash
skills install            # Deploy via symlinks
skills install --dry-run  # Preview without changes
```

The install process:
1. **Clean** — Remove all symlinks pointing to our source (old state)
2. **Deploy** — Create symlinks for skills listed in the current profile
3. **Conflict** — If a non-managed skill has the same name, ask the user

## Profile

A profile defines which skills go to which platform directory.

```json
{
    "name": "personal",
    "description": "Personal Mac setup",
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

Skills can be shared across targets — `skills-meta` appears in both Claude Code and OpenClaw.

## Skill Structure

```
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── references/       # Optional: supporting data
├── scripts/          # Optional: executable scripts
└── sub-skills/       # Optional: nested skills
```

### SKILL.md Frontmatter

```yaml
---
name: my-skill
description: What this skill does
requires:
  mcp: [github]          # Required MCP servers
  skills: [other-skill]  # Required skills
  tools: [jq, git]       # Required system tools
---
```

## Design Principles

- **Single Source of Truth** — One repo, symlinks everywhere
- **Idempotent** — Run `skills install` anytime, safe to repeat
- **Non-destructive** — Conflicts prompt user, backups before overwrite
- **Platform agnostic** — Works with any tool that reads skills from a directory

## License

MIT
