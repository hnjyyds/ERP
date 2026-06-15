import { Select } from 'antd'
import { Children, isValidElement, type ReactNode } from 'react'

type FormSelectChangeEvent = {
  target: {
    value: string
  }
}

type FormSelectProps = {
  children?: ReactNode
  disabled?: boolean
  id?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: (event: FormSelectChangeEvent) => void
}

type OptionChildProps = {
  children?: ReactNode
  disabled?: boolean
  value?: string | number
}

function childToOption(child: ReactNode, index: number) {
  if (!isValidElement<OptionChildProps>(child)) return null

  const rawValue = child.props.value ?? child.props.children ?? ''
  const value = String(rawValue)

  return {
    disabled: child.props.disabled,
    label: child.props.children,
    value,
    key: child.key ?? `${value}-${index}`,
  }
}

export function FormSelect({ children, onChange, required, ...props }: FormSelectProps) {
  const options = Children.toArray(children)
    .map((child, index) => childToOption(child, index))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))

  return (
    <Select
      {...props}
      aria-required={required}
      options={options}
      onChange={(value) => {
        onChange?.({ target: { value } })
      }}
    />
  )
}
