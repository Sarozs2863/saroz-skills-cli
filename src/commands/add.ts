import { Command } from 'commander'
import { select, confirm, multiselect, text } from '@clack/prompts'
import kleur from 'kleur'
import { isInitialized } from '../core/paths.js'
import { findSkillPath, isValidSkillName, listCategories, createSkill } from '../core/skills.js'
import { currentProfile } from '../core/config.js'
import { getProfile, addSkillToProfile } from '../core/profiles.js'
import { deploy } from '../core/deployer.js'

export const addCommand = new Command('add')
    .description('创建新 skill')
    .argument('<name>', 'skill 名称')
    .option('-c, --category <category>', '分类目录')
    .option('-t, --target <targets...>', '添加到 profile 的 target（可多个）')
    .option('--no-profile', '不添加到 profile')
    .action(async (name: string, opts) => {
        if (!isInitialized()) {
            console.error(kleur.red('未初始化，请先运行 skills init'))
            process.exit(1)
        }

        // 校验 name
        if (!isValidSkillName(name)) {
            console.error(kleur.red(`✗ 名称不合法：${name}`))
            console.log(kleur.gray('  只允许 a-z 0-9 -，不能以 - 开头或结尾'))
            process.exit(1)
        }

        // 检查是否已存在
        if (findSkillPath(name)) {
            console.error(kleur.red(`✗ skill 已存在：${name}`))
            process.exit(1)
        }

        // 选择分类
        let category: string
        if (opts.category) {
            category = opts.category
        } else {
            const categories = listCategories()
            const categoryOptions = [
                ...categories.map(c => ({ label: c, value: c })),
                { label: '新建分类...', value: '__new__' },
            ]

            let chosen = await select({
                message: '放到哪个分类？',
                options: categoryOptions,
            })

            if (chosen === '__new__') {
                const newCat = await text({
                    message: '输入新分类名称：',
                    validate: (val) => {
                        if (!isValidSkillName(val)) return '只允许 a-z 0-9 -'
                    }
                })
                if (typeof newCat !== 'string') process.exit(1)
                chosen = newCat
            }

            if (typeof chosen !== 'string') process.exit(1)
            category = chosen
        }

        // 创建 skill
        createSkill(name, category)
        console.log(kleur.green('✓') + ` 已创建 skills/${category}/${name}/SKILL.md`)

        // 不添加到 profile
        if (opts.profile === false) return

        // 添加到 profile
        const profileName = currentProfile()
        let profile
        try {
            profile = getProfile(profileName)
        } catch {
            console.log(kleur.gray('ℹ 当前无可用 profile，跳过'))
            return
        }

        let selectedTargets: string[]
        if (opts.target) {
            // 非交互式：直接用参数
            selectedTargets = opts.target
        } else {
            // 交互式
            const shouldAdd = await confirm({
                message: `添加到当前 profile (${profileName})？`,
            })

            if (shouldAdd !== true) return

            const targetNames = Object.keys(profile.targets)
            if (targetNames.length === 0) {
                console.log(kleur.gray('ℹ profile 中无 target，跳过'))
                return
            }

            const chosen = await multiselect({
                message: '添加到哪些 target？',
                options: targetNames.map(t => ({ label: t, value: t })),
            })

            if (!Array.isArray(chosen) || chosen.length === 0) return
            selectedTargets = chosen
        }

        addSkillToProfile(profileName, selectedTargets, name)
        console.log(kleur.green('✓') + ` 已添加到 ${profileName}/${selectedTargets.join(', ')}`)

        // 自动 install
        console.log('')
        await deploy()
        console.log(kleur.green('✓') + ' 已同步部署')
    })
