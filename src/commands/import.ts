import { Command } from 'commander'
import { existsSync } from 'fs'
import { resolve, join } from 'path'
import { select, confirm, multiselect, text } from '@clack/prompts'
import kleur from 'kleur'
import { isInitialized } from '../core/paths.js'
import { findSkillPath, isValidSkillName, listCategories, getSkillName, importSkill } from '../core/skills.js'
import { currentProfile } from '../core/config.js'
import { getProfile, addSkillToProfile } from '../core/profiles.js'
import { deploy } from '../core/deployer.js'

export const importCommand = new Command('import')
    .description('从外部路径导入 skill')
    .argument('<path>', 'skill 目录路径')
    .action(async (inputPath: string) => {
        if (!isInitialized()) {
            console.error(kleur.red('未初始化，请先运行 skills init'))
            process.exit(1)
        }

        const fullPath = resolve(inputPath)

        // 检查路径存在
        if (!existsSync(fullPath)) {
            console.error(kleur.red(`✗ 路径不存在：${fullPath}`))
            process.exit(1)
        }

        // 检查包含 SKILL.md
        if (!existsSync(join(fullPath, 'SKILL.md'))) {
            console.error(kleur.red(`✗ 不是合法的 skill 目录：缺少 SKILL.md`))
            process.exit(1)
        }

        // 解析 name
        const name = getSkillName(fullPath)
        console.log(kleur.gray(`ℹ 解析 SKILL.md → name: ${name}`))

        // 校验 name
        if (!isValidSkillName(name)) {
            console.error(kleur.red(`✗ skill name 不合法：${name}`))
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

        // 导入
        const { destPath } = importSkill(fullPath, category)
        console.log(kleur.green('✓') + ` 已移动到 ${kleur.gray(destPath)}`)
        console.log(kleur.green('✓') + ` 原位置已创建 symlink → ${kleur.gray(destPath)}`)

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
