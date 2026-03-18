import { readFileSync, writeFileSync, existsSync } from 'fs'
import { profilePath } from './paths.js'
import { t } from '../i18n.js'
import type { Profile } from '../types.js'

export function getProfile(name: string): Profile {
    const filePath = profilePath(name)

    if (!existsSync(filePath)) {
        throw new Error(t('common.profile_not_found', { name, path: filePath }))
    }

    try {
        const content = readFileSync(filePath, 'utf-8')
        return JSON.parse(content)
    } catch {
        throw new Error(t('common.profile_format_error', { path: filePath }))
    }
}

export function addSkillToProfile(profileName: string, targetNames: string[], skillName: string): void {
    const profile = getProfile(profileName)

    for (const targetName of targetNames) {
        const target = profile.targets[targetName]
        if (!target) {
            throw new Error(t('common.target_not_found', { name: targetName, profile: profileName }))
        }
        if (!target.skills.includes(skillName)) {
            target.skills.push(skillName)
        }
    }

    const filePath = profilePath(profileName)
    writeFileSync(filePath, JSON.stringify(profile, null, 4) + '\n')
}
