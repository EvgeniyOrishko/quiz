import type { CSSProperties } from 'react'
import type { Theme } from './types'

/** Converts `{unit, value}` design tokens to a CSS value. */
// Design tokens are heterogeneous (colour, size, weight) so the result is intentionally loose.
export function u(v: any): any {
  if (v == null) return undefined
  if (typeof v !== 'object') return v
  const { unit, value } = v
  if (value == null || value === '') return undefined
  if (unit === 'px' || unit === '%' || unit === 'em' || unit === 's') return `${value}${unit}`
  if (unit === 'seconds') return `${value}s`
  return value
}

export function font(v: any): string | undefined {
  if (!v || v.value == null) return undefined
  if (v.unit === 'inherit' || v.value === 'inherit') return 'inherit'
  return `"${v.value}", ${v.meta ?? 'sans-serif'}`
}

/** Drops undefined entries so spreading a partial override never clobbers a base value. */
const clean = (o: CSSProperties): CSSProperties =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as CSSProperties

/** Generic token bag → CSS properties for text-like elements. */
export function textStyle(o: Record<string, any> = {}): CSSProperties {
  return clean({
    color: u(o.color),
    fontFamily: font(o.fontFamily),
    fontSize: u(o.fontSize),
    fontWeight: u(o.fontWeight) as any,
    lineHeight: u(o.lineHeight),
    textAlign: u(o.textAlign) as any,
    textDecoration: u(o.textDecoration) as any,
  })
}

export function boxStyle(o: Record<string, any> = {}): CSSProperties {
  const px = u(o.paddingHorizontal)
  const py = u(o.paddingVertical)
  const bw = u(o.borderWidth)
  const shadow =
    o.shadowColor?.value && (o.shadowBlurRadius || o.shadowOffsetY || o.shadowSpreadRadius)
      ? `${u(o.shadowOffsetX) ?? 0} ${u(o.shadowOffsetY) ?? 0} ${u(o.shadowBlurRadius) ?? 0} ${u(o.shadowSpreadRadius) ?? 0} ${u(o.shadowColor)}`
      : undefined
  return clean({
    backgroundColor: u(o.backgroundColor) as any,
    borderRadius: u(o.borderRadius),
    borderColor: u(o.borderColor) as any,
    borderWidth: bw,
    borderStyle: bw && bw !== '0px' ? 'solid' : undefined,
    paddingLeft: px,
    paddingRight: px,
    paddingTop: py,
    paddingBottom: py,
    boxShadow: shadow,
  })
}

export function themeVars(theme: Theme): CSSProperties {
  const t = theme.ui.theme
  const vars: Record<string, string | number | undefined> = {
    '--bg': u(t.app.backgroundColor),
    '--primary': u(t.app.colorPrimary),
    '--secondary': u(t.app.colorSecondary),
    '--text': u(t.app.colorText),
    '--on-primary': u(t.app.colorTextOnPrimary),
    '--radius-box': u(t.app.borderRadiusBox),
    '--pad-x': u(t.app.paddingHorizontal),
    '--font': font(t.app.fontFamily),
    '--card-bg': u(t.card?.backgroundColor),
    '--card-radius': u(t.card?.borderRadius),
    '--err': u(t.errorText?.color),
    '--link': u(t.link?.color),
  }
  return vars as CSSProperties
}
