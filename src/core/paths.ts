import { homedir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'

const HOME = join(homedir(), '.saroz-skills')
const CHEZMOI = join(homedir(), '.local', 'share', 'chezmoi')

export const paths = {
    home: HOME,
    source: join(CHEZMOI, 'skills'),
    skills: join(CHEZMOI, 'skills'),
    profiles: join(CHEZMOI, 'skills-profiles'),
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
