import { useMemo } from 'react'
import { DEFAULT_LOCALE, loadContent } from './funnel/content'
import { FunnelProvider } from './funnel/state'
import { ScreenView } from './funnel/Screen'
import { themeVars } from './funnel/style'

export default function App() {
  const locale = useMemo(() => new URLSearchParams(location.search).get('ff-locale') ?? DEFAULT_LOCALE, [])
  const content = useMemo(() => loadContent(locale), [locale])
  return (
    <div className="ff-app" style={themeVars(content.theme)} lang={content.locale}>
      <FunnelProvider content={content}>
        <ScreenView />
      </FunnelProvider>
    </div>
  )
}
