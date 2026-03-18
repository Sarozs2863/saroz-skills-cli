import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync, renameSync, symlinkSync, lstatSync, readlinkSync } from 'fs'
import { join, basename, relative, resolve, dirname } from 'path'
import matter from 'gray-matter'
import { paths } from './paths.js'
import { t } from '../i18n.js'
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
                description: t('common.frontmatter_error'),
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

const VALID_NAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export function isValidSkillName(name: string): boolean {
    return VALID_NAME_RE.test(name)
}

export function listCategories(): string[] {
    if (!existsSync(paths.skills)) return []
    return readdirSync(paths.skills).filter(entry => {
        const full = join(paths.skills, entry)
        return statSync(full).isDirectory() && !existsSync(join(full, 'SKILL.md'))
    })
}

export function createSkill(name: string, category: string): string {
    const dir = join(paths.skills, category, name)
    mkdirSync(dir, { recursive: true })

    const skillMd = `---\nname: ${name}\ndescription: TODO\n---\n\nTODO: 描述这个 skill 的用途和使用方式\n`
    writeFileSync(join(dir, 'SKILL.md'), skillMd)

    return dir
}

export function getSkillName(skillDir: string): string {
    const skillMdPath = join(skillDir, 'SKILL.md')
    try {
        const content = readFileSync(skillMdPath, 'utf-8')
        const { data } = matter(content)
        return data.name ?? basename(skillDir)
    } catch {
        return basename(skillDir)
    }
}

export function importSkill(sourcePath: string, category: string): { name: string; destPath: string } {
    // 如果 sourcePath 是 symlink，解析到真实路径
    let realPath = sourcePath
    try {
        if (lstatSync(sourcePath).isSymbolicLink()) {
            realPath = resolve(dirname(sourcePath), readlinkSync(sourcePath))
        }
    } catch { /* use original */ }

    const name = getSkillName(realPath)
    const destPath = join(paths.skills, category, name)

    mkdirSync(dirname(destPath), { recursive: true })

    // 移动到仓库
    renameSync(realPath, destPath)

    // 在原位置创建 symlink 指回去
    symlinkSync(destPath, realPath)

    return { name, destPath }
}
