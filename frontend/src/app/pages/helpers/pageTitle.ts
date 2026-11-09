import type { MenuItem } from '@/api'
import { translate } from '@/locales'
import { routeDefinitionFor } from '@/app/routes'

import { getRuntimeSettings, type AppSettings } from './runtimeSettings'

export function pageTitle(
  path: string,
  menu: MenuItem | null,
  settings: AppSettings = getRuntimeSettings(),
): string {
  const titleKey = routeDefinitionFor(path)?.titleKey
  if (titleKey) {
    return translate(settings.language, titleKey)
  }
  return menu?.label ?? translate(settings.language, 'nav.page.businessModule')
}
