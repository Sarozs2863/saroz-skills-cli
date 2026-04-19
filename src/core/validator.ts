import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { paths } from './paths.js'

export function validateSourceRepo(): { valid: boolean; missing: string[] } {
    const missing: string[] = []
    if (!existsSync(paths.skills)) missing.push('skills')
    if (!existsSync(paths.profiles)) missing.push('skills-profiles')
    return { valid: missing.length === 0, missing }
}

export function listAvailableProfiles(): string[] {
    if (!existsSync(paths.profiles)) return []

    return readdirSync(paths.profiles)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
}
