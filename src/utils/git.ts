import { execSync } from 'child_process'

export function gitClone(url: string, targetDir: string): void {
    execSync(`git clone ${url} ${targetDir}`, { stdio: 'inherit' })
}

export function gitInit(dir: string): void {
    execSync('git init', { cwd: dir, stdio: 'inherit' })
}
