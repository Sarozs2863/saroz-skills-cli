import { readdirSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { confirm } from '@clack/prompts'
import { paths } from '../core/paths.js'
import { t } from '../i18n.js'
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
            // ignore
        }
    }

    return removed
}

export async function createSkillSymlink(sourcePath: string, targetDir: string, skillName: string): Promise<DeployAction> {
    const dir = expandTilde(targetDir)
    const linkPath = join(dir, skillName)

    mkdirSync(dir, { recursive: true })

    if (!pathExists(linkPath)) {
        symlinkSync(sourcePath, linkPath)
        return 'created'
    }

    console.log(`\n  ⚠ ${t('conflict.title', { name: skillName })}`)
    console.log(`    ${t('conflict.description')}`)
    const shouldOverwrite = await confirm({
        message: t('conflict.confirm'),
    })

    if (shouldOverwrite === true) {
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
