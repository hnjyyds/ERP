import { Alert, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { listAssignableUsers, type AssignableUser } from '@/api'
import { t } from '@/app/appI18n'

type Props = {
  currentUserId: string
  onChange: (userId: string) => void
  requiredPermission: string
  value: string
  label?: string
}

export function ApprovalAssigneeSelect({
  currentUserId,
  onChange,
  requiredPermission,
  value,
  label = t('common.approvalAssignee.defaultLabel'),
}: Props) {
  const [users, setUsers] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listAssignableUsers(requiredPermission)
      .then((response) => {
        if (active) setUsers(response.users.filter((user) => user.id !== currentUserId))
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : t('common.approvalAssignee.loadFailed'),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentUserId, requiredPermission])

  const options = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.display_name} / ${user.department_name}`,
      })),
    [users],
  )

  return (
    <label>
      <span className="required-label">{label}</span>
      <Select
        aria-label={label}
        loading={loading}
        onChange={onChange}
        options={options}
        placeholder={t('common.approvalAssignee.selectPlaceholder', { label })}
        showSearch
        value={value || undefined}
        optionFilterProp="label"
      />
      {error ? <Alert message={error} showIcon type="error" /> : null}
    </label>
  )
}
