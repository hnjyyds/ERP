import { ChevronDown, ImagePlus, UploadCloud } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import type { UserAvatarType } from '../../api'
import { UserAvatar, avatarPresets, resolveAvatarPreset, type AvatarPreset } from './UserAvatar'

export type UserAvatarPickerValue = {
  avatar_type: UserAvatarType
  avatar_value: string
}

type UserAvatarPickerProps = {
  value: UserAvatarPickerValue
  label: string
  description?: string
  onChange: (value: UserAvatarPickerValue) => void
}

type AvatarPickerTab = 'person' | 'emoji' | 'upload'

const maxAvatarBytes = 900_000

const avatarTabs: Array<{ key: AvatarPickerTab; label: string }> = [
  { key: 'person', label: '人物头像' },
  { key: 'emoji', label: '表情' },
  { key: 'upload', label: '自定义上传' },
]

function tabFromValue(value: UserAvatarPickerValue): AvatarPickerTab {
  if (value.avatar_type === 'upload') return 'upload'
  return resolveAvatarPreset(value.avatar_value).category
}

function groupPresets(presets: AvatarPreset[]) {
  return presets.reduce<Array<{ title: string; items: AvatarPreset[] }>>((groups, preset) => {
    const group = groups.find((item) => item.title === preset.group)
    if (group) {
      group.items.push(preset)
      return groups
    }

    groups.push({ title: preset.group, items: [preset] })
    return groups
  }, [])
}

export function UserAvatarPicker({
  description = '保存后会同步到用户资料、用户列表和可指派人员。',
  label,
  onChange,
  value,
}: UserAvatarPickerProps) {
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AvatarPickerTab>(() => tabFromValue(value))
  const currentPreset = resolveAvatarPreset(value.avatar_value)
  const groupedAvatarPresets = useMemo(
    () => groupPresets(avatarPresets.filter((preset) => preset.category === activeTab)),
    [activeTab],
  )

  useEffect(() => {
    setActiveTab(tabFromValue(value))
  }, [value.avatar_type, value.avatar_value])

  function selectPreset(avatarValue: string) {
    setError('')
    onChange({ avatar_type: 'preset', avatar_value: avatarValue })
    setPickerOpen(false)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    if (file.size > maxAvatarBytes) {
      setError('头像图片需小于 900KB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('头像读取失败')
        return
      }
      setError('')
      onChange({ avatar_type: 'upload', avatar_value: reader.result })
      setPickerOpen(false)
    }
    reader.onerror = () => setError('头像读取失败')
    reader.readAsDataURL(file)
  }

  return (
    <section className="user-avatar-picker" aria-label="用户头像">
      <button
        aria-expanded={pickerOpen}
        className="user-avatar-picker-current"
        type="button"
        onClick={() => setPickerOpen((open) => !open)}
      >
        <UserAvatar
          avatarType={value.avatar_type}
          avatarValue={value.avatar_value}
          label={label || '用户'}
          size="lg"
        />
        <div>
          <span>头像</span>
          <strong>{value.avatar_type === 'upload' ? '自定义上传' : currentPreset.label}</strong>
        </div>
        <ChevronDown className={pickerOpen ? 'user-avatar-picker-toggle open' : 'user-avatar-picker-toggle'} size={20} />
      </button>

      {pickerOpen ? (
        <>
          <div className="user-avatar-picker-tabs" role="tablist" aria-label="头像类型">
            {avatarTabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'selected' : ''}
                key={tab.key}
                role="tab"
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="user-avatar-picker-panel">
            {activeTab === 'upload' ? (
              <div className="user-avatar-picker-upload-panel">
                <label className="user-avatar-picker-upload">
                  <input accept="image/*" type="file" onChange={handleFileChange} />
                  <UploadCloud size={18} />
                  <span>选择图片</span>
                </label>
                <p>
                  <ImagePlus size={16} />
                  <span>{description} 支持 PNG、JPG，图片需小于 900KB。</span>
                </p>
              </div>
            ) : (
              <div className="user-avatar-picker-sections">
                {groupedAvatarPresets.map((group) => (
                  <section className="user-avatar-picker-section" key={group.title}>
                    <h4>{group.title}</h4>
                    <div
                      className={`user-avatar-picker-icon-grid user-avatar-picker-icon-grid-${activeTab}`}
                      aria-label={group.title}
                    >
                      {group.items.map((preset) => {
                        const selected = value.avatar_type === 'preset' && currentPreset.id === preset.id
                        return (
                          <button
                            aria-label={`选择${preset.label}`}
                            aria-pressed={selected}
                            className={selected ? 'selected' : ''}
                            key={preset.id}
                            title={preset.label}
                            type="button"
                            onClick={() => selectPreset(preset.id)}
                          >
                            <UserAvatar avatarType="preset" avatarValue={preset.id} label={preset.label} size="md" />
                            <span className="visually-hidden">{preset.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
      {error ? <p className="user-avatar-picker-error">{error}</p> : null}
    </section>
  )
}
