import { Button, Checkbox, Dropdown } from 'antd'
import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const STORAGE_PREFIX = 'yuanjing_view_columns:'

export type ColumnOption = {
  key: string
  title: string
  // 必选列不可隐藏（如主键/编号），避免空表头。
  required?: boolean
}

function readStored(viewKey: string): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + viewKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : null
  } catch {
    return null
  }
}

function writeStored(viewKey: string, hidden: string[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + viewKey, JSON.stringify(hidden))
  } catch {
    // 存储不可用时退化为内存态，不阻断使用。
  }
}

/**
 * 多视图列配置：按 viewKey 持久化隐藏列集合到 localStorage，
 * 返回当前可见列 key、判断函数与配置控件渲染器。
 */
export function useColumnView(viewKey: string, options: ColumnOption[]) {
  const [hidden, setHidden] = useState<string[]>(() => readStored(viewKey) ?? [])

  const isVisible = useCallback(
    (key: string) => !hidden.includes(key),
    [hidden],
  )

  const toggle = useCallback(
    (key: string, checked: boolean) => {
      setHidden((current) => {
        const next = checked
          ? current.filter((item) => item !== key)
          : current.includes(key)
            ? current
            : [...current, key]
        writeStored(viewKey, next)
        return next
      })
    },
    [viewKey],
  )

  const reset = useCallback(() => {
    setHidden([])
    writeStored(viewKey, [])
  }, [viewKey])

  const control = useMemo(
    () => (
      <ColumnViewControl options={options} isVisible={isVisible} onToggle={toggle} onReset={reset} />
    ),
    [options, isVisible, toggle, reset],
  )

  return { isVisible, control, hidden }
}

type ControlProps = {
  options: ColumnOption[]
  isVisible: (key: string) => boolean
  onToggle: (key: string, checked: boolean) => void
  onReset: () => void
}

function ColumnViewControl({ options, isVisible, onToggle, onReset }: ControlProps) {
  const menu = (
    <div className="column-view-menu">
      {options.map((option) => (
        <div key={option.key} className="column-view-item">
          <Checkbox
            checked={isVisible(option.key)}
            disabled={option.required}
            onChange={(event) => onToggle(option.key, event.target.checked)}
          >
            {option.title}
          </Checkbox>
        </div>
      ))}
      <button className="column-view-reset" type="button" onClick={onReset}>
        恢复默认
      </button>
    </div>
  )

  return (
    <Dropdown dropdownRender={() => menu} trigger={['click']}>
      <Button icon={<SlidersHorizontal size={16} />}>视图</Button>
    </Dropdown>
  )
}
