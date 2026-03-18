import { Command } from 'commander'
import { deploy } from '../core/deployer.js'
import { currentProfile } from '../core/config.js'
import { isInitialized } from '../core/paths.js'
import { t } from '../i18n.js'
import kleur from 'kleur'

export const installCommand = new Command('install')
    .description(t('cmd.install.description'))
    .option('--dry-run', t('cmd.install.opt.dry_run'))
    .action(async (opts) => {
        if (!isInitialized()) {
            console.error(kleur.red(t('common.not_initialized')))
            process.exit(1)
        }

        const profileName = currentProfile()
        const prefix = opts.dryRun ? kleur.yellow('[dry-run] ') : ''
        console.log(`\n${prefix}${t('cmd.install.syncing', { name: profileName })}\n`)

        const results = await deploy(opts.dryRun)

        let totalCreated = 0
        let totalSkipped = 0
        let totalOverwritten = 0

        for (const result of results) {
            console.log(`  ${kleur.cyan(result.targetName)} → ${kleur.gray(result.targetPath)}`)

            for (const skill of result.skills) {
                switch (skill.action) {
                    case 'created':
                        console.log(`    ${kleur.green('✓')} ${skill.name}`)
                        totalCreated++
                        break
                    case 'skipped':
                        console.log(`    ${kleur.yellow('-')} ${skill.name} ${kleur.gray('(skipped' + (skill.message ? `: ${skill.message}` : '') + ')')}`)
                        totalSkipped++
                        break
                    case 'overwritten':
                        console.log(`    ${kleur.green('✓')} ${skill.name} ${kleur.gray('(overwritten)')}`)
                        totalOverwritten++
                        break
                }
            }

            console.log()
        }

        const total = totalCreated + totalSkipped + totalOverwritten
        const parts = [`total: ${total}`]
        if (totalOverwritten) parts.push(`overwritten: ${totalOverwritten}`)
        if (totalSkipped) parts.push(`skipped: ${totalSkipped}`)

        console.log(`${prefix}${kleur.green('✓')} ${t('cmd.install.done', { summary: parts.join(', ') })}`)
    })
