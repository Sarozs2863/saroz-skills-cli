import { readFileSync, writeFileSync, existsSync } from 'fs'
import { profilePath } from './paths.js'
import type { Profile } from '../types.js'

export function getProfile(name: string): Profile {
    const filePath = profilePath(name)

    if (!existsSync(filePath)) {
        throw new Error(`Profile 不存在：${name}（${filePath}）`)
    }

    try {
        const content = readFileSync(filePath, 'utf-8')
        return JSON.parse(content)
    } catch {
        throw new Error(`Profile 格式错误：${filePath}`)
    }
}

export function addSkillToProfile(profileName: string, targetNames: string[], skillName: string): void {
    const profile = getProfile(profileName)

    for (const targetName of targetNames) {
        const target = profile.targets[targetName]
        if (!target) {
            throw new Error(`Target 不存在：${targetName}（profile: ${profileName}）`)
        }
        if (!target.skills.includes(skillName)) {
            target.skills.push(skillName)
        }
    }

    const filePath = profilePath(profileName)
    writeFileSync(filePath, JSON.stringify(profile, null, 4) + '\n')
}
