import { Alert, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { listAssignableUsers, type AssignableUser } from '../../api'

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
  label = '审批人',
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
          setError(reason instanceof Error ? reason.message : '审批人加载失败')
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
        placeholder={`选择${label}`}
        showSearch
        value={value || undefined}
        optionFilterProp="label"
      />
      {error ? <Alert message={error} showIcon type="error" /> : null}
    </label>
  )
}
