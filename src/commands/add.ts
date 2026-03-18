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
    .action(async (name: string) => {
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
        const categories = listCategories()
        const categoryOptions = [
            ...categories.map(c => ({ label: c, value: c })),
            { label: '新建分类...', value: '__new__' },
        ]

        let category = await select({
            message: '放到哪个分类？',
            options: categoryOptions,
        })

        if (category === '__new__') {
            const newCat = await text({
                message: '输入新分类名称：',
                validate: (val) => {
                    if (!isValidSkillName(val)) return '只允许 a-z 0-9 -'
                }
            })
            if (typeof newCat !== 'string') process.exit(1)
            category = newCat
        }

        if (typeof category !== 'string') process.exit(1)

        // 创建 skill
        createSkill(name, category)
        console.log(kleur.green('✓') + ` 已创建 skills/${category}/${name}/SKILL.md`)

        // 添加到 profile
        const profileName = currentProfile()
        let profile
        try {
            profile = getProfile(profileName)
        } catch {
            console.log(kleur.gray('ℹ 当前无可用 profile，跳过'))
            return
        }

        const shouldAdd = await confirm({
            message: `添加到当前 profile (${profileName})？`,
        })

        if (shouldAdd !== true) return

        const targetNames = Object.keys(profile.targets)
        if (targetNames.length === 0) {
            console.log(kleur.gray('ℹ profile 中无 target，跳过'))
            return
        }

        const selectedTargets = await multiselect({
            message: '添加到哪些 target？',
            options: targetNames.map(t => ({ label: t, value: t })),
        })

        if (!Array.isArray(selectedTargets) || selectedTargets.length === 0) return

        addSkillToProfile(profileName, selectedTargets, name)
        console.log(kleur.green('✓') + ` 已添加到 ${profileName}/${selectedTargets.join(', ')}`)

        // 自动 install
        console.log('')
        await deploy()
        console.log(kleur.green('✓') + ' 已同步部署')
    })
