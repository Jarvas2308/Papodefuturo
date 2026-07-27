export type NavigationIcon =
  | 'dashboard'
  | 'portfolio'
  | 'contribution'
  | 'history'
  | 'officialEvents'
  | 'strategy'
  | 'settings'

export type NavigationItem = {
  to: string
  label: string
  icon: NavigationIcon
}

export type PageCopy = {
  title: string
  description: string
}
