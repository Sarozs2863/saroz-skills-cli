import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

type Messages = Record<string, string>

const locales: Record<string, Messages> = {}

for (const lang of ['en', 'zh']) {
    const filePath = join(__dirname, `locales/${lang}.json`)
    locales[lang] = JSON.parse(readFileSync(filePath, 'utf-8'))
}

function getSystemLocale(): string {
    const env = process.env
    const langStr = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE || 'en_US'
    const lang = langStr.split(/[._-]/)[0].toLowerCase()
    return lang === 'zh' ? 'zh' : 'en'
}

let currentLocale = getSystemLocale()

export function setLocale(lang: string): void {
    currentLocale = lang in locales ? lang : 'en'
}

export function getLocale(): string {
    return currentLocale
}

export function t(key: string, params?: Record<string, string | number>): string {
    let msg = locales[currentLocale]?.[key] ?? locales['en']?.[key] ?? key

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            msg = msg.replace(`{${k}}`, String(v))
        }
    }

    return msg
}
