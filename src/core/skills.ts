import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, basename, relative } from 'path'
import matter from 'gray-matter'
import { paths } from './paths.js'
import type { SkillMeta } from '../types.js'

interface SkillDir {
    path: string
    category: string
}

function findAllSkillDirs(dir: string): SkillDir[] {
    const results: SkillDir[] = []
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (!statSync(full).isDirectory()) continue
        if (existsSync(join(full, 'SKILL.md'))) {
            const category = relative(paths.skills, dir) || '.'
            results.push({ path: full, category })
        } else {
            results.push(...findAllSkillDirs(full))
        }
    }
    return results
}

export function listSkills(): SkillMeta[] {
    const dirs = findAllSkillDirs(paths.skills)
    const skills: SkillMeta[] = []

    for (const { path: dir, category } of dirs) {
        try {
            const content = readFileSync(join(dir, 'SKILL.md'), 'utf-8')
            const { data } = matter(content)
            skills.push({
                name: data.name ?? basename(dir),
                description: data.description ?? '',
                category,
                requires: data.requires,
            })
        } catch {
            skills.push({
                name: basename(dir),
                description: '(frontmatter 解析失败)',
                category,
            })
        }
    }

    return skills
}

export function listSkillsByCategory(): Record<string, SkillMeta[]> {
    const skills = listSkills()
    const grouped: Record<string, SkillMeta[]> = {}

    for (const skill of skills) {
        if (!grouped[skill.category]) {
            grouped[skill.category] = []
        }
        grouped[skill.category].push(skill)
    }

    return grouped
}

export function findSkillPath(name: string): string | null {
    const dirs = findAllSkillDirs(paths.skills)
    for (const { path: dir } of dirs) {
        if (basename(dir) === name) {
            return dir
        }
    }
    return null
}
