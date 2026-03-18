import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { paths } from './paths.js'
import { t } from '../i18n.js'
import type { Config } from '../types.js'

const DEFAULT_CONFIG: Config = {
    profile: 'default',
}

export function readConfig(): Config {
    if (!existsSync(paths.configFile)) {
        return DEFAULT_CONFIG
    }

    try {
        const content = readFileSync(paths.configFile, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    } catch {
        throw new Error(t('common.config_error', { path: paths.configFile }))
    }
}

export function writeConfig(partial: Partial<Config>): void {
    const current = existsSync(paths.configFile) ? readConfig() : DEFAULT_CONFIG
    const merged = { ...current, ...partial }
    mkdirSync(dirname(paths.configFile), { recursive: true })
    writeFileSync(paths.configFile, JSON.stringify(merged, null, 4) + '\n')
}

export function currentProfile(): string {
    return readConfig().profile
}
