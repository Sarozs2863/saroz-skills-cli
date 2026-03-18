import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { select, confirm } from '@clack/prompts'
import kleur from 'kleur'
import { paths, isInitialized } from '../core/paths.js'
import { validateSourceRepo, listAvailableProfiles } from '../core/validator.js'
import { writeConfig } from '../core/config.js'
import { listSkills } from '../core/skills.js'
import { gitClone, gitInit } from '../utils/git.js'

export const initCommand = new Command('init')
    .description('初始化 saroz-skills')
    .argument('[repo-url]', '已有仓库的 Git URL')
    .action(async (repoUrl?: string) => {
        // 检查是否已初始化
        if (isInitialized()) {
            console.error(kleur.red('✗ 已初始化，source 目录已存在：' + paths.source))
            console.log(kleur.gray('ℹ 如需重新初始化，先删除 ~/.saroz-skills/ 目录'))
            process.exit(1)
        }

        if (repoUrl) {
            await initFromRepo(repoUrl)
        } else {
            initFromScratch()
        }
    })

async function initFromRepo(repoUrl: string) {
    // 创建辅助目录
    mkdirSync(paths.config, { recursive: true })
    mkdirSync(paths.state, { recursive: true })

    // clone
    console.log(`\nCloning ${repoUrl}...\n`)
    try {
        gitClone(repoUrl, paths.source)
    } catch {
        // clone 失败，清理
        const { rmSync } = await import('fs')
        rmSync(paths.home, { recursive: true, force: true })
        console.error(kleur.red('✗ clone 失败'))
        process.exit(1)
    }

    console.log(kleur.green('✓') + ' 已 clone 到 ' + kleur.gray(paths.source))

    // 校验仓库结构
    const { valid, missing } = validateSourceRepo()

    if (!valid) {
        console.log(kleur.yellow(`⚠ 仓库缺少以下目录：${missing.join(', ')}`))
        const shouldFix = await confirm({
            message: '是否自动创建缺少的目录结构？',
        })

        if (shouldFix === true) {
            for (const dir of missing) {
                mkdirSync(join(paths.source, dir), { recursive: true })
            }
            console.log(kleur.green('✓') + ` 已创建 ${missing.join(' 和 ')}`)
        } else {
            const { rmSync } = await import('fs')
            rmSync(paths.home, { recursive: true, force: true })
            console.log('已中止初始化')
            process.exit(1)
        }
    }

    // 统计
    const skillCount = listSkills().length
    const profiles = listAvailableProfiles()
    console.log(kleur.green('✓') + ` 校验通过 (${skillCount} skills, ${profiles.length} profiles)`)

    // 设置 profile
    if (profiles.length === 1) {
        writeConfig({ profile: profiles[0] })
        console.log(kleur.green('✓') + ` 已设置 profile: ${kleur.bold(profiles[0])}`)
    } else if (profiles.length > 1) {
        const chosen = await select({
            message: '选择要使用的 profile：',
            options: profiles.map(p => ({ label: p, value: p })),
        })

        if (typeof chosen === 'string') {
            writeConfig({ profile: chosen })
            console.log(kleur.green('✓') + ` 已设置 profile: ${kleur.bold(chosen)}`)
        }
    } else {
        console.log(kleur.gray('ℹ 暂无 profile，使用 skills profile create <name> 创建'))
    }
}

function initFromScratch() {
    // 创建完整骨架
    mkdirSync(join(paths.source, 'skills'), { recursive: true })
    mkdirSync(join(paths.source, 'profiles'), { recursive: true })
    mkdirSync(paths.config, { recursive: true })
    mkdirSync(paths.state, { recursive: true })

    // README
    writeFileSync(join(paths.source, 'README.md'), '# saroz-skills\n\nAI Skills 统一管理仓库。\n')

    // 默认 config
    writeConfig({ profile: 'default' })

    // git init
    gitInit(paths.source)

    console.log(kleur.green('\n✓') + ' 空仓库已创建于 ' + kleur.gray(paths.source))
    console.log(kleur.gray('ℹ 使用 skills add <name> 添加第一个 skill'))
}
