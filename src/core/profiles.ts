import { readFileSync, existsSync } from 'fs'
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
