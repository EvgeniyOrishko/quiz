import type { Content, PageMeta, Screen, Theme } from './types'

const json = import.meta.glob('./content/*/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const screenJson = import.meta.glob('./content/*/screens/*.json', { eager: true, import: 'default' }) as Record<
  string,
  Screen
>

export const LOCALES = Array.from(new Set(Object.keys(json).map((p) => p.split('/')[2])))
export const DEFAULT_LOCALE = 'ru'

const cache: Record<string, Content> = {}

export function loadContent(locale: string): Content {
  const loc = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
  if (cache[loc]) return cache[loc]
  const screens: Record<string, Screen> = {}
  for (const [path, s] of Object.entries(screenJson)) {
    if (path.split('/')[2] === loc) screens[s.slug] = s
  }
  cache[loc] = {
    locale: loc,
    order: json[`./content/${loc}/order.json`] as string[],
    pages: json[`./content/${loc}/pages.json`] as PageMeta[],
    theme: json[`./content/${loc}/theme.json`] as Theme,
    screens,
  }
  return cache[loc]
}
