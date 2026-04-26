import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { homedir, tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveSkillEnv } from '../src/core/env.js'

const tempDirs: string[] = []

function createSkillFixture(files: Record<string, unknown>): string {
    const dir = mkdtempSync(join(tmpdir(), 'skills-env-'))
    tempDirs.push(dir)

    for (const [name, content] of Object.entries(files)) {
        writeFileSync(join(dir, name), JSON.stringify(content, null, 4) + '\n')
    }

    return dir
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        rmSync(dir, { recursive: true, force: true })
    }
})

describe('resolveSkillEnv', () => {
    it('returns only env declared by the skill schema', () => {
        const skillPath = createSkillFixture({
            'env.schema.json': {
                vars: {
                    'folders.vault': { required: true },
                    'folders.skills': { required: true },
                },
            },
            'env.defaults.json': {
                folders: {
                    skills: '~/.saroz-skills/source',
                },
            },
        })

        const result = resolveSkillEnv(skillPath, {
            folders: {
                vault: '/Users/saroz/vault/my-source-code',
                unrelated: '/tmp/unrelated',
            },
        })

        expect(result).toEqual({
            env: {
                folders: {
                    vault: '/Users/saroz/vault/my-source-code',
                    skills: join(homedir(), '.saroz-skills/source'),
                },
            },
            missing: [],
        })
    })

    it('reports missing required env keys', () => {
        const skillPath = createSkillFixture({
            'env.schema.json': {
                vars: {
                    'folders.vault': { required: true },
                    'folders.skills': { required: true },
                },
            },
        })

        const result = resolveSkillEnv(skillPath, {
            folders: {
                vault: '/Users/saroz/vault/my-source-code',
            },
        })

        expect(result).toEqual({
            env: {
                folders: {
                    vault: '/Users/saroz/vault/my-source-code',
                },
            },
            missing: ['folders.skills'],
        })
    })
})
