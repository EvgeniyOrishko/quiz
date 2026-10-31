export interface StyleVal {
  unit?: string
  value?: unknown
  meta?: string
}
export type Styles = Record<string, Record<string, any>>

export interface ActionPayload {
  type: 'const'
  value: any
}
export interface FunnelAction {
  type: 'navigate' | 'visibility' | 'scroll' | 'link' | string
  payload?: ActionPayload
  delayMs?: number
}

export interface FunnelElement {
  id: string
  type: string
  customId?: string
  displayName?: string
  props: Record<string, any>
  styles: Styles
  visibility?: { type: 'const'; value: boolean }
}

export interface HierarchyNode {
  id: string
  children?: HierarchyNode[]
}

export interface Screen {
  id: string
  slug: string
  index: number
  customId?: string
  props: {
    type?: string
    header: {
      back: boolean
      counter: boolean
      progressBar: boolean
      title: string
      image?: string
      alt?: string
      imagePos?: string
    }
    autoNavigation: { enabled: boolean; delay?: number }
  }
  elements: FunnelElement[]
  hierarchy: HierarchyNode
  styles: Styles
}

export interface PageMeta {
  id: string
  slug: string
  index: number
  customId?: string
}

export interface Theme {
  ui: {
    theme: Record<string, Record<string, any>>
    components: {
      progressBar: { segments: number; total: number; type: string; screens: string[] }
    }
  }
  meta: { title: string }
}

export interface Content {
  locale: string
  order: string[]
  pages: PageMeta[]
  theme: Theme
  screens: Record<string, Screen>
}
