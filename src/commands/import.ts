import { Command } from 'commander'
import { existsSync } from 'fs'
import { resolve, join } from 'path'
import { select, confirm, multiselect, text } from '@clack/prompts'
import kleur from 'kleur'
import { t } from '../i18n.js'
import { isInitialized } from '../core/paths.js'
import { findSkillPath, isValidSkillName, listCategories, getSkillName, importSkill } from '../core/skills.js'
import { currentProfile } from '../core/config.js'
import { getProfile, addSkillToProfile } from '../core/profiles.js'
import { deploy } from '../core/deployer.js'

export const importCommand = new Command('import')
    .description(t('cmd.import.description'))
    .argument('<path>', t('cmd.import.arg.path'))
    .option('-c, --category <category>', t('cmd.add.opt.category'))
    .option('-t, --target <targets...>', t('cmd.add.opt.target'))
    .option('--no-profile', t('cmd.add.opt.no_profile'))
    .action(async (inputPath: string, opts) => {
        if (!isInitialized()) {
            console.error(kleur.red(t('common.not_initialized')))
            process.exit(1)
        }

        const fullPath = resolve(inputPath)

        if (!existsSync(fullPath)) {
            console.error(kleur.red('✗ ' + t('cmd.import.path_not_found', { path: fullPath })))
            process.exit(1)
        }

        if (!existsSync(join(fullPath, 'SKILL.md'))) {
            console.error(kleur.red('✗ ' + t('cmd.import.no_skill_md')))
            process.exit(1)
        }

        const name = getSkillName(fullPath)
        console.log(kleur.gray('ℹ ' + t('cmd.import.parsed_name', { name })))

        if (!isValidSkillName(name)) {
            console.error(kleur.red('✗ ' + t('cmd.add.invalid_name', { name })))
            console.log(kleur.gray('  ' + t('cmd.add.name_hint')))
            process.exit(1)
        }

        if (findSkillPath(name)) {
            console.error(kleur.red('✗ ' + t('cmd.add.already_exists', { name })))
            process.exit(1)
        }

        let category: string
        if (opts.category) {
            category = opts.category
        } else {
            const categories = listCategories()
            const categoryOptions = [
                ...categories.map(c => ({ label: c, value: c })),
                { label: t('cmd.add.new_category'), value: '__new__' },
            ]

            let chosen = await select({
                message: t('cmd.add.select_category'),
                options: categoryOptions,
            })

            if (chosen === '__new__') {
                const newCat = await text({
                    message: t('cmd.add.enter_category'),
                    validate: (val) => {
                        if (!isValidSkillName(val)) return t('cmd.add.name_hint')
                    }
                })
                if (typeof newCat !== 'string') process.exit(1)
                chosen = newCat
            }

            if (typeof chosen !== 'string') process.exit(1)
            category = chosen
        }

        const { destPath } = importSkill(fullPath, category)
        console.log(kleur.green('✓') + ' ' + t('cmd.import.moved', { path: destPath }))
        console.log(kleur.green('✓') + ' ' + t('cmd.import.symlinked', { path: destPath }))

        if (opts.profile === false) return

        const profileName = currentProfile()
        let profile
        try {
            profile = getProfile(profileName)
        } catch {
            console.log(kleur.gray('ℹ ' + t('cmd.add.no_profile')))
            return
        }

        let selectedTargets: string[]
        if (opts.target) {
            selectedTargets = opts.target
        } else {
            const shouldAdd = await confirm({
                message: t('cmd.add.confirm_profile', { name: profileName }),
            })

            if (shouldAdd !== true) return

            const targetNames = Object.keys(profile.targets)
            if (targetNames.length === 0) {
                console.log(kleur.gray('ℹ ' + t('cmd.add.no_targets')))
                return
            }

            const chosen = await multiselect({
                message: t('cmd.add.select_targets'),
                options: targetNames.map(t => ({ label: t, value: t })),
            })

            if (!Array.isArray(chosen) || chosen.length === 0) return
            selectedTargets = chosen
        }

        addSkillToProfile(profileName, selectedTargets, name)
        console.log(kleur.green('✓') + ' ' + t('cmd.add.added_to_profile', { profile: profileName, targets: selectedTargets.join(', ') }))

        console.log('')
        await deploy()
        console.log(kleur.green('✓') + ' ' + t('cmd.add.deployed'))
    })
