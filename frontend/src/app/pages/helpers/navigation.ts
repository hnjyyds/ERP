export type NavigateToModule = (path: string) => void

export type ModuleNavigationProps = {
  onNavigate: NavigateToModule
}

export type RoutedDetailPageProps = ModuleNavigationProps & {
  detailId: string | null
}
