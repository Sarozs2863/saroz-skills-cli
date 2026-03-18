import { homedir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'

const HOME = join(homedir(), '.saroz-skills')

export const paths = {
    home: HOME,
    source: join(HOME, 'source'),
    skills: join(HOME, 'source', 'skills'),
    profiles: join(HOME, 'source', 'profiles'),
    config: join(HOME, 'config'),
    configFile: join(HOME, 'config', 'config.json'),
    state: join(HOME, 'state'),
    backups: join(HOME, 'state', 'backups'),
}

export function profilePath(name: string): string {
    return join(paths.profiles, `${name}.json`)
}

export function isInitialized(): boolean {
    return existsSync(paths.source)
}
