import { t } from '../../../appI18n'
import {
  countSelectedPermissions,
  permissionCategoryLabel,
  permissionSectionText,
  type OrganizationPermissionGroup,
  type OrganizationPermissionSection,
} from '../organizationHelpers'

type OrganizationPermissionMatrixProps = {
  groups: OrganizationPermissionGroup[]
  selectedIds: string[]
  showCategory?: boolean
  showGroupSelectAll?: boolean
  onTogglePermission: (permissionId: string) => void
  onToggleSection: (section: OrganizationPermissionSection, selected: boolean) => void
  onToggleGroup?: (group: OrganizationPermissionGroup, selected: boolean) => void
}

export function OrganizationPermissionMatrix({
  groups,
  selectedIds,
  showCategory = false,
  showGroupSelectAll = false,
  onTogglePermission,
  onToggleSection,
  onToggleGroup,
}: OrganizationPermissionMatrixProps) {
  return (
    <div className="organization-permission-groups">
      {groups.map((group) => {
        const groupItems = group.sections.flatMap((section) => section.items)
        const groupSelectedCount = countSelectedPermissions(groupItems, selectedIds)
        const groupFullySelected = groupItems.length > 0 && groupSelectedCount === groupItems.length

        return (
          <section className="organization-permission-module" key={group.key}>
            <header>
              <div>
                <span>{t('organization.permission.sidebarModule')}</span>
                <h3>{t(group.labelKey)}</h3>
              </div>
              {showGroupSelectAll && onToggleGroup ? (
                <label className="organization-permission-bulk">
                  <input
                    aria-label={t('organization.permission.selectAllAria', {
                      name: t(group.labelKey),
                    })}
                    checked={groupFullySelected}
                    disabled={!groupItems.length}
                    type="checkbox"
                    onChange={(event) => onToggleGroup(group, event.target.checked)}
                  />
                  {groupSelectedCount}/{groupItems.length}
                </label>
              ) : null}
            </header>
            <div className="organization-permission-sections">
              {group.sections.map((section) => {
                const selectedCount = countSelectedPermissions(section.items, selectedIds)
                const sectionFullySelected =
                  section.items.length > 0 && selectedCount === section.items.length

                return (
                  <div className="organization-permission-section" key={section.key}>
                    <div className="organization-permission-section-head">
                      <div>
                        <small>{t(group.labelKey)}</small>
                        <strong>{permissionSectionText(section)}</strong>
                      </div>
                      <label>
                        <input
                          aria-label={t('organization.permission.selectAllAria', {
                            name: permissionSectionText(section),
                          })}
                          checked={sectionFullySelected}
                          disabled={!section.items.length}
                          type="checkbox"
                          onChange={(event) => onToggleSection(section, event.target.checked)}
                        />
                        {selectedCount}/{section.items.length}
                      </label>
                    </div>
                    <div className="organization-permission-checks">
                      {section.items.length ? (
                        section.items.map((permission) => {
                          const checked = selectedIds.includes(permission.id)
                          return (
                            <label className={checked ? 'selected' : ''} key={permission.id}>
                              <input
                                aria-label={permission.name}
                                checked={checked}
                                type="checkbox"
                                onChange={() => onTogglePermission(permission.id)}
                              />
                              <span>
                                {permission.name}
                                {showCategory ? (
                                  <em
                                    className={`organization-permission-tag tag-${permission.category}`}
                                  >
                                    {permissionCategoryLabel(permission)}
                                  </em>
                                ) : null}
                              </span>
                              <small>{permission.code}</small>
                            </label>
                          )
                        })
                      ) : (
                        <div className="organization-permission-missing">
                          {t('organization.permission.none')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
