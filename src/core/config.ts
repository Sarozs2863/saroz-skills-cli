import { readFileSync, existsSync } from 'fs'
import { paths } from './paths.js'
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
        throw new Error(`配置文件格式错误：${paths.configFile}`)
    }
}

export function currentProfile(): string {
    return readConfig().profile
}
