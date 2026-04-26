import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

type JsonObject = Record<string, unknown>

interface EnvVarSpec {
    required?: boolean
    description?: string
}

interface SkillEnvSchema {
    vars?: Record<string, EnvVarSpec | boolean | string>
    required?: string[]
    optional?: string[]
}

export interface SkillEnvResult {
    env: JsonObject
    missing: string[]
}

function isPlainObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readJsonObject(filePath: string): JsonObject {
    if (!existsSync(filePath)) return {}
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    if (!isPlainObject(parsed)) {
        throw new Error(`Expected JSON object: ${filePath}`)
    }
    return parsed
}

function mergeObjects(base: JsonObject, override: JsonObject): JsonObject {
    const result: JsonObject = { ...base }

    for (const [key, value] of Object.entries(override)) {
        const current = result[key]
        if (isPlainObject(current) && isPlainObject(value)) {
            result[key] = mergeObjects(current, value)
        } else {
            result[key] = value
        }
    }

    return result
}

function getByDotPath(source: JsonObject, keyPath: string): unknown {
    let cursor: unknown = source

    for (const segment of keyPath.split('.')) {
        if (!isPlainObject(cursor) || !(segment in cursor)) {
            return undefined
        }
        cursor = cursor[segment]
    }

    return cursor
}

function setByDotPath(target: JsonObject, keyPath: string, value: unknown): void {
    const segments = keyPath.split('.')
    let cursor = target

    for (const segment of segments.slice(0, -1)) {
        const current = cursor[segment]
        if (!isPlainObject(current)) {
            cursor[segment] = {}
        }
        cursor = cursor[segment] as JsonObject
    }

    cursor[segments[segments.length - 1]] = value
}

function expandTildeValue(value: unknown): unknown {
    if (typeof value === 'string') {
        if (value === '~') return homedir()
        if (value.startsWith('~/')) return join(homedir(), value.slice(2))
        return value
    }

    if (Array.isArray(value)) {
        return value.map(item => expandTildeValue(item))
    }

    if (isPlainObject(value)) {
        const result: JsonObject = {}
        for (const [key, nestedValue] of Object.entries(value)) {
            result[key] = expandTildeValue(nestedValue)
        }
        return result
    }

    return value
}

function readSchema(skillPath: string): SkillEnvSchema {
    const schemaPath = join(skillPath, 'env.schema.json')
    if (!existsSync(schemaPath)) return {}

    const parsed = readJsonObject(schemaPath)
    return parsed as SkillEnvSchema
}

function collectVars(schema: SkillEnvSchema): { keys: string[]; required: Set<string> } {
    const keys = new Set<string>()
    const required = new Set<string>()

    for (const key of schema.required ?? []) {
        keys.add(key)
        required.add(key)
    }

    for (const key of schema.optional ?? []) {
        keys.add(key)
    }

    for (const [key, spec] of Object.entries(schema.vars ?? {})) {
        keys.add(key)
        if (spec === true || (isPlainObject(spec) && spec.required === true)) {
            required.add(key)
        }
    }

    return { keys: [...keys], required }
}

export function resolveSkillEnv(skillPath: string, profileEnv: JsonObject = {}): SkillEnvResult {
    const schema = readSchema(skillPath)
    const defaults = readJsonObject(join(skillPath, 'env.defaults.json'))
    const source = mergeObjects(defaults, profileEnv)
    const { keys, required } = collectVars(schema)
    const env: JsonObject = {}
    const missing: string[] = []

    for (const key of keys) {
        const value = getByDotPath(source, key)
        if (value === undefined) {
            if (required.has(key)) {
                missing.push(key)
            }
            continue
        }
        setByDotPath(env, key, expandTildeValue(value))
    }

    return { env, missing }
}
