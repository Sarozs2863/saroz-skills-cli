import { readdirSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { confirm } from '@clack/prompts'
import { paths } from '../core/paths.js'
import type { DeployAction } from '../types.js'

function expandTilde(p: string): string {
    return p.startsWith('~') ? join(homedir(), p.slice(1)) : p
}

function isOurSymlink(linkPath: string): boolean {
    try {
        const target = readlinkSync(linkPath)
        const resolved = resolve(join(linkPath, '..'), target)
        return resolved.startsWith(paths.skills)
    } catch {
        return false
    }
}

function pathExists(p: string): boolean {
    try {
        lstatSync(p)
        return true
    } catch {
        return false
    }
}

export function cleanManagedSymlinks(targetDir: string): string[] {
    const dir = expandTilde(targetDir)
    if (!existsSync(dir)) return []

    const removed: string[] = []

    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        try {
            if (lstatSync(full).isSymbolicLink() && isOurSymlink(full)) {
                unlinkSync(full)
                removed.push(entry)
            }
        } catch {
            // 忽略无法读取的条目
        }
    }

    return removed
}

export async function createSkillSymlink(sourcePath: string, targetDir: string, skillName: string): Promise<DeployAction> {
    const dir = expandTilde(targetDir)
    const linkPath = join(dir, skillName)

    // 确保目标目录存在
    mkdirSync(dir, { recursive: true })

    // 目标位置无同名条目 → 创建
    if (!pathExists(linkPath)) {
        symlinkSync(sourcePath, linkPath)
        return 'created'
    }

    // 有同名条目（非我方的，Step 1 已清掉我方的）→ 询问用户
    console.log(`\n  ⚠ 冲突：${skillName}`)
    console.log(`    目标目录已有同名 skill（非 saroz-skills 管理）`)
    const shouldOverwrite = await confirm({
        message: `是否使用 saroz-skills 进行覆盖？（原文件将备份到 ~/.saroz-skills/state/backups/）`,
    })

    if (shouldOverwrite === true) {
        // 备份到 state/backups/
        const backupDir = paths.backups
        mkdirSync(backupDir, { recursive: true })
        const backupPath = join(backupDir, `${skillName}-${Date.now()}`)
        renameSync(linkPath, backupPath)

        symlinkSync(sourcePath, linkPath)
        return 'overwritten'
    }

    return 'skipped'
}

export { expandTilde }
