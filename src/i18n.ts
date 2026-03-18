import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

type Messages = Record<string, string>

const locales: Record<string, Messages> = {}

// 尝试多个路径，兼容开发模式和打包后
function loadLocale(lang: string): Messages {
    const candidates = [
        join(__dirname, `locales/${lang}.json`),         // dev: src/locales/
        join(__dirname, `../src/locales/${lang}.json`),   // dist: ../src/locales/
    ]

    for (const p of candidates) {
        if (existsSync(p)) {
            return JSON.parse(readFileSync(p, 'utf-8'))
        }
    }

    return {}
}

for (const lang of ['en', 'zh']) {
    locales[lang] = loadLocale(lang)
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
