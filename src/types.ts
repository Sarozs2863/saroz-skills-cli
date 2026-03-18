export interface SkillRequires {
    mcp: string[]
    skills: string[]
    tools: string[]
}

export interface SkillMeta {
    name: string
    description: string
    category: string        // 所属分类目录（如 claude-code、openclaw、common）
    requires?: SkillRequires
}
