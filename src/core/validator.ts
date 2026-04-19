import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { paths } from './paths.js'

export function validateSourceRepo(): { valid: boolean; missing: string[] } {
    const required = ['skills', 'profiles']
    const missing: string[] = []

    for (const dir of required) {
        if (!existsSync(join(paths.source, dir))) {
            missing.push(dir)
        }
    }

    return { valid: missing.length === 0, missing }
}

export function listAvailableProfiles(): string[] {
    if (!existsSync(paths.profiles)) return []

    return readdirSync(paths.profiles)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
}
