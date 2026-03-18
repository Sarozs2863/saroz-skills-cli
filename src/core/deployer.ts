import { currentProfile } from './config.js'
import { getProfile } from './profiles.js'
import { findSkillPath } from './skills.js'
import { cleanManagedSymlinks, createSkillSymlink } from '../utils/symlink.js'
import { t } from '../i18n.js'
import type { DeployResult } from '../types.js'

export async function deploy(dryRun = false): Promise<DeployResult[]> {
    const profileName = currentProfile()
    const profile = getProfile(profileName)
    const results: DeployResult[] = []

    for (const [targetName, target] of Object.entries(profile.targets)) {
        const result: DeployResult = {
            targetName,
            targetPath: target.path,
            skills: [],
        }

        // Step 1: 清场
        if (!dryRun) {
            cleanManagedSymlinks(target.path)
        }

        // Step 2: 部署
        for (const skillName of target.skills) {
            const sourcePath = findSkillPath(skillName)

            if (!sourcePath) {
                result.skills.push({
                    name: skillName,
                    action: 'skipped',
                    message: t('cmd.install.skill_not_found'),
                })
                continue
            }

            if (dryRun) {
                result.skills.push({
                    name: skillName,
                    action: 'created',
                    message: 'would create',
                })
            } else {
                const action = await createSkillSymlink(sourcePath, target.path, skillName)
                result.skills.push({ name: skillName, action })
            }
        }

        results.push(result)
    }

    return results
}
