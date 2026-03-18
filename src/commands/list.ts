import { Command } from 'commander'
import { listSkillsByCategory } from '../core/skills.js'
import { isInitialized } from '../core/paths.js'
import { t } from '../i18n.js'
import kleur from 'kleur'

export const listCommand = new Command('list')
    .description(t('cmd.list.description'))
    .option('-v, --verbose', t('cmd.list.opt.verbose'))
    .action((opts) => {
        if (!isInitialized()) {
            console.error(kleur.red(t('common.not_initialized')))
            process.exit(1)
        }

        const grouped = listSkillsByCategory()
        const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)

        if (total === 0) {
            console.log(t('cmd.list.empty'))
            return
        }

        console.log(kleur.bold(`Skills (${total}):\n`))

        for (const [category, skills] of Object.entries(grouped)) {
            const label = category === '.' ? '/' : `${category}/`
            console.log(`  ${kleur.cyan(label)} ${kleur.gray(`(${skills.length})`)}`)

            if (opts.verbose) {
                for (const skill of skills) {
                    console.log(`    ${kleur.green(skill.name)}`)
                    console.log(`      ${kleur.gray(skill.description)}`)
                }
            } else {
                const names = skills.map(s => kleur.green(s.name)).join('  ')
                console.log(`    ${names}`)
            }

            console.log()
        }
    })
