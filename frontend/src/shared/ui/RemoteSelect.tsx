import { Select, Tag } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'

type RemoteSelectOption = {
  label: string
  value: string
  description?: string
}

type RemoteSelectProps = {
  allowClear?: boolean
  disabled?: boolean
  fetchOptions: (query: string) => Promise<RemoteSelectOption[]>
  id?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  value?: string | null
}

export function RemoteSelect({
  allowClear = true,
  disabled,
  fetchOptions,
  id,
  onChange,
  placeholder = '输入关键词搜索',
  required,
  value,
}: RemoteSelectProps) {
  const [options, setOptions] = useState<RemoteSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(false)

  const loadOptions = useCallback(
    async (query: string) => {
      setLoading(true)
      try {
        const items = await fetchOptions(query)
        if (!mountedRef.current) return
        setOptions(items)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    },
    [fetchOptions],
  )

  useEffect(() => {
    mountedRef.current = true
    void loadOptions('')
    return () => {
      mountedRef.current = false
    }
  }, [loadOptions])

  const selectedOption = value ? options.find((option) => option.value === value) ?? null : null
  const resolvedOptions = selectedOption && !options.some((option) => option.value === selectedOption.value)
    ? [selectedOption, ...options]
    : options

  return (
    <Select
      allowClear={allowClear}
      disabled={disabled}
      filterOption={false}
      id={id}
      loading={loading}
      notFoundContent={loading ? '搜索中...' : '无匹配结果'}
      onChange={(nextValue) => onChange?.(nextValue ?? '')}
      onSearch={(query) => void loadOptions(query)}
      optionLabelProp="label"
      placeholder={placeholder}
      showSearch
      status={required && !value ? 'error' : undefined}
      value={value || undefined}
    >
      {resolvedOptions.map((option) => (
        <Select.Option key={option.value} label={option.label} value={option.value}>
          <div className="remote-select-option">
            <span className="remote-select-option-title">{option.label}</span>
            {option.description ? (
              <span className="remote-select-option-desc">{option.description}</span>
            ) : null}
          </div>
        </Select.Option>
      ))}
    </Select>
  )
}
