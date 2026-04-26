import { Command } from 'commander'
import kleur from 'kleur'
import { currentProfile } from '../core/config.js'
import { resolveSkillEnv } from '../core/env.js'
import { isInitialized } from '../core/paths.js'
import { getProfile } from '../core/profiles.js'
import { findSkillPath } from '../core/skills.js'
import { t } from '../i18n.js'

export const envCommand = new Command('env')
    .description(t('cmd.env.description'))

envCommand
    .command('get')
    .description(t('cmd.env.get.description'))
    .argument('<skill>', t('cmd.env.get.arg.skill'))
    .action((skillName: string) => {
        if (!isInitialized()) {
            console.error(kleur.red(t('common.not_initialized')))
            process.exit(1)
        }

        const skillPath = findSkillPath(skillName)
        if (!skillPath) {
            console.error(kleur.red(t('cmd.env.skill_not_found', { name: skillName })))
            process.exit(1)
        }

        try {
            const profileName = currentProfile()
            const profile = getProfile(profileName)
            const result = resolveSkillEnv(skillPath, profile.env ?? {})

            if (result.missing.length > 0) {
                console.error(kleur.red(t('cmd.env.missing_required', {
                    skill: skillName,
                    keys: result.missing.join(', '),
                })))
                process.exit(1)
            }

            console.log(JSON.stringify(result.env, null, 2))
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(kleur.red(t('cmd.env.failed', { message })))
            process.exit(1)
        }
    })
