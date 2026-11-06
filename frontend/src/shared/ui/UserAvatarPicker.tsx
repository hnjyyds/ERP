import { ChevronDown, ImagePlus, UploadCloud } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import type { UserAvatarType } from '../../api'
import { t, type TranslationKey } from '../../app/appI18n'
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

const avatarTabs: Array<{ key: AvatarPickerTab; labelKey: TranslationKey }> = [
  { key: 'person', labelKey: 'common.avatar.picker.person' },
  { key: 'emoji', labelKey: 'common.avatar.picker.emoji' },
  { key: 'upload', labelKey: 'common.avatar.picker.upload' },
]

function tabFromValue(value: UserAvatarPickerValue): AvatarPickerTab {
  if (value.avatar_type === 'upload') return 'upload'
  return resolveAvatarPreset(value.avatar_value).category
}

function groupPresets(presets: AvatarPreset[]) {
  return presets.reduce<Array<{ titleKey: TranslationKey; items: AvatarPreset[] }>>((groups, preset) => {
    const group = groups.find((item) => item.titleKey === preset.groupKey)
    if (group) {
      group.items.push(preset)
      return groups
    }

    groups.push({ titleKey: preset.groupKey, items: [preset] })
    return groups
  }, [])
}

export function UserAvatarPicker({
  description = t('common.avatar.picker.description'),
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
      setError(t('common.avatar.picker.chooseImageFile'))
      return
    }
    if (file.size > maxAvatarBytes) {
      setError(t('common.avatar.picker.imageTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError(t('common.avatar.picker.readFailed'))
        return
      }
      setError('')
      onChange({ avatar_type: 'upload', avatar_value: reader.result })
      setPickerOpen(false)
    }
    reader.onerror = () => setError(t('common.avatar.picker.readFailed'))
    reader.readAsDataURL(file)
  }

  return (
    <section className="user-avatar-picker" aria-label={t('common.avatar.picker.userAvatar')}>
      <button
        aria-expanded={pickerOpen}
        className="user-avatar-picker-current"
        type="button"
        onClick={() => setPickerOpen((open) => !open)}
      >
        <UserAvatar
          avatarType={value.avatar_type}
          avatarValue={value.avatar_value}
          label={label || t('common.avatar.picker.userPlaceholder')}
          size="lg"
        />
        <div>
          <span>{t('common.avatar.picker.avatar')}</span>
          <strong>
            {value.avatar_type === 'upload' ? t('common.avatar.picker.upload') : t(currentPreset.labelKey)}
          </strong>
        </div>
        <ChevronDown className={pickerOpen ? 'user-avatar-picker-toggle open' : 'user-avatar-picker-toggle'} size={20} />
      </button>

      {pickerOpen ? (
        <>
          <div
            className="user-avatar-picker-tabs"
            role="tablist"
            aria-label={t('common.avatar.picker.avatarType')}
          >
            {avatarTabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'selected' : ''}
                key={tab.key}
                role="tab"
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="user-avatar-picker-panel">
            {activeTab === 'upload' ? (
              <div className="user-avatar-picker-upload-panel">
                <label className="user-avatar-picker-upload">
                  <input
                    accept="image/*"
                    aria-label={t('common.avatar.picker.selectAvatarImage')}
                    type="file"
                    onChange={handleFileChange}
                  />
                  <UploadCloud size={18} />
                  <span>{t('common.avatar.picker.selectImage')}</span>
                </label>
                <p>
                  <ImagePlus size={16} />
                  <span>
                    {description} {t('common.avatar.picker.imageHint')}
                  </span>
                </p>
              </div>
            ) : (
              <div className="user-avatar-picker-sections">
                {groupedAvatarPresets.map((group) => {
                  const groupTitle = t(group.titleKey)
                  return (
                    <section className="user-avatar-picker-section" key={group.titleKey}>
                      <h4>{groupTitle}</h4>
                      <div
                        className={`user-avatar-picker-icon-grid user-avatar-picker-icon-grid-${activeTab}`}
                        aria-label={groupTitle}
                      >
                        {group.items.map((preset) => {
                          const selected = value.avatar_type === 'preset' && currentPreset.id === preset.id
                          const presetLabel = t(preset.labelKey)
                          return (
                            <button
                              aria-label={t('common.avatar.picker.selectPreset', { preset: presetLabel })}
                              aria-pressed={selected}
                              className={selected ? 'selected' : ''}
                              key={preset.id}
                              title={presetLabel}
                              type="button"
                              onClick={() => selectPreset(preset.id)}
                            >
                              <UserAvatar avatarType="preset" avatarValue={preset.id} label={presetLabel} size="md" />
                              <span className="visually-hidden">{presetLabel}</span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
      {error ? <p className="user-avatar-picker-error">{error}</p> : null}
    </section>
  )
}
