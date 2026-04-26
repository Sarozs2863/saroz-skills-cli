export interface SkillRequires {
    mcp: string[]
    skills: string[]
    tools: string[]
}

export interface SkillMeta {
    name: string
    description: string
    category: string
    requires?: SkillRequires
}

export interface ProfileTarget {
    path: string
    skills: string[]
}

export interface Profile {
    name: string
    description: string
    targets: Record<string, ProfileTarget>
    env?: Record<string, unknown>
}

export interface Config {
    profile: string
}

export type DeployAction = 'created' | 'skipped' | 'overwritten'

export interface DeployResult {
    targetName: string
    targetPath: string
    skills: Array<{
        name: string
        action: DeployAction
        message?: string
    }>
}
