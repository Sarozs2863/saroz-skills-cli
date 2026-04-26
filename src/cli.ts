#!/usr/bin/env node
import { Command } from 'commander'
import { t, setLocale } from './i18n.js'
import { initCommand } from './commands/init.js'
import { listCommand } from './commands/list.js'
import { addCommand } from './commands/add.js'
import { importCommand } from './commands/import.js'
import { installCommand } from './commands/install.js'
import { envCommand } from './commands/env.js'

const program = new Command()

program
    .name('skills')
    .description(t('cli.description'))
    .version('0.2.1')
    .option('--lang <locale>', 'Set language (en/zh)')
    .hook('preAction', (thisCommand) => {
        const opts = thisCommand.opts()
        if (opts.lang) setLocale(opts.lang)
    })

program.addCommand(initCommand)
program.addCommand(listCommand)
program.addCommand(addCommand)
program.addCommand(importCommand)
program.addCommand(installCommand)
program.addCommand(envCommand)

program.parse()
