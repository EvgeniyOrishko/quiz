import { useFunnel } from '../state'
import { textStyle } from '../style'
import type { ElProps } from '../Renderer'

export function TextEl({ el }: ElProps) {
  const { content, interpolate } = useFunnel()
  const type: string = el.props.type ?? 'paragraph'
  const theme = content.theme.ui.theme
  const style = { ...textStyle(theme[type]), ...textStyle(el.styles?.[type]) }
  const auto = type === 'paragraph' && el.styles?.paragraph?.fontSize == null
  const html = interpolate(String(el.props.content ?? ''))
  const Tag = (['h1', 'h2', 'h3'].includes(type) ? type : 'div') as 'h1' | 'h2' | 'h3' | 'div'
  return <Tag className={`ff-text ff-${type}${auto ? ' ff-text--auto' : ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}
