#!/usr/bin/env node
import { Command } from 'commander'
import { listCommand } from './commands/list.js'
import { installCommand } from './commands/install.js'

const program = new Command()

program
    .name('skills')
    .description('AI Skills 管理工具')
    .version('0.1.0')

program.addCommand(listCommand)
program.addCommand(installCommand)

program.parse()
