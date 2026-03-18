import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { select, confirm } from '@clack/prompts'
import kleur from 'kleur'
import { t } from '../i18n.js'
import { paths, isInitialized } from '../core/paths.js'
import { validateSourceRepo, listAvailableProfiles } from '../core/validator.js'
import { writeConfig } from '../core/config.js'
import { listSkills } from '../core/skills.js'
import { gitClone, gitInit } from '../utils/git.js'

export const initCommand = new Command('init')
    .description(t('cmd.init.description'))
    .argument('[repo-url]', t('cmd.init.arg.repo'))
    .option('-p, --profile <profile>', t('cmd.init.opt.profile'))
    .option('--fix', t('cmd.init.opt.fix'))
    .action(async (repoUrl: string | undefined, opts) => {
        if (isInitialized()) {
            console.error(kleur.red('✗ ' + t('cmd.init.already_initialized', { path: paths.source })))
            console.log(kleur.gray('ℹ ' + t('cmd.init.hint_reinit')))
            process.exit(1)
        }

        if (repoUrl) {
            await initFromRepo(repoUrl, opts)
        } else {
            initFromScratch()
        }
    })

async function initFromRepo(repoUrl: string, opts: { profile?: string; fix?: boolean }) {
    mkdirSync(paths.config, { recursive: true })
    mkdirSync(paths.state, { recursive: true })

    console.log(`\n${t('cmd.init.cloning', { url: repoUrl })}\n`)
    try {
        gitClone(repoUrl, paths.source)
    } catch {
        const { rmSync } = await import('fs')
        rmSync(paths.home, { recursive: true, force: true })
        console.error(kleur.red('✗ ' + t('cmd.init.clone_failed')))
        process.exit(1)
    }

    console.log(kleur.green('✓') + ' ' + t('cmd.init.cloned', { path: paths.source }))

    const { valid, missing } = validateSourceRepo()

    if (!valid) {
        console.log(kleur.yellow('⚠ ' + t('cmd.init.missing_dirs', { dirs: missing.join(', ') })))

        const shouldFix = opts.fix ?? await (async () => {
            const result = await confirm({ message: t('cmd.init.confirm_fix') })
            return result === true
        })()

        if (shouldFix) {
            for (const dir of missing) {
                mkdirSync(join(paths.source, dir), { recursive: true })
            }
            console.log(kleur.green('✓') + ' ' + t('cmd.init.dirs_created', { dirs: missing.join(', ') }))
        } else {
            const { rmSync } = await import('fs')
            rmSync(paths.home, { recursive: true, force: true })
            console.log(t('cmd.init.aborted'))
            process.exit(1)
        }
    }

    const skillCount = listSkills().length
    const profiles = listAvailableProfiles()
    console.log(kleur.green('✓') + ' ' + t('cmd.init.validated', { skills: skillCount, profiles: profiles.length }))

    if (opts.profile) {
        writeConfig({ profile: opts.profile })
        console.log(kleur.green('✓') + ' ' + t('cmd.init.profile_set', { name: opts.profile }))
    } else if (profiles.length === 1) {
        writeConfig({ profile: profiles[0] })
        console.log(kleur.green('✓') + ' ' + t('cmd.init.profile_set', { name: profiles[0] }))
    } else if (profiles.length > 1) {
        const chosen = await select({
            message: t('cmd.init.select_profile'),
            options: profiles.map(p => ({ label: p, value: p })),
        })

        if (typeof chosen === 'string') {
            writeConfig({ profile: chosen })
            console.log(kleur.green('✓') + ' ' + t('cmd.init.profile_set', { name: chosen }))
        }
    } else {
        console.log(kleur.gray('ℹ ' + t('cmd.init.no_profiles')))
    }
}

function initFromScratch() {
    mkdirSync(join(paths.source, 'skills'), { recursive: true })
    mkdirSync(join(paths.source, 'profiles'), { recursive: true })
    mkdirSync(paths.config, { recursive: true })
    mkdirSync(paths.state, { recursive: true })

    writeFileSync(join(paths.source, 'README.md'), '# saroz-skills\n\nAI Skills management repo.\n')
    writeConfig({ profile: 'default' })
    gitInit(paths.source)

    console.log(kleur.green('\n✓') + ' ' + t('cmd.init.scratch_done', { path: paths.source }))
    console.log(kleur.gray('ℹ ' + t('cmd.init.scratch_hint')))
}
