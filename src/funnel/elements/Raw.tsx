import { useEffect } from 'react'
import { useFunnel } from '../state'
import type { ElProps } from '../Renderer'

/**
 * Raw HTML block. Third-party <script> tags are intentionally stripped — behaviour that the source
 * funnel loaded remotely must be re-implemented in the app.
 *
 * `insights-teaser` embedded an external widget (iframe) that relayed the user's answers and then
 * advanced the funnel; the source falls back to "skip" when the widget is unavailable. We use that
 * same fail-open path until a local teaser is built (hook: `TEASER_MOUNT` below).
 */
const TEASER_MOUNT = 'cognius-teaser-mount'

export function RawEl({ el }: ElProps) {
  const { navigate } = useFunnel()
  const raw = String(el.props.__html ?? '')
  const isTeaser = raw.includes(TEASER_MOUNT)
  useEffect(() => {
    if (isTeaser) navigate(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeaser])

  const html = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim()
  if (!html || isTeaser) return null
  return <div className="ff-raw" dangerouslySetInnerHTML={{ __html: html }} />
}
