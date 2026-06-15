import { ImagePlus, Sparkles } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

import type { UserAvatarType } from '../../api'
import { UserAvatar, avatarPresets } from './UserAvatar'

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

const maxAvatarBytes = 900_000

export function UserAvatarPicker({
  description = '保存后会同步到用户资料、用户列表和可指派人员。',
  label,
  onChange,
  value,
}: UserAvatarPickerProps) {
  const [error, setError] = useState('')

  function selectPreset(avatarValue: string) {
    setError('')
    onChange({ avatar_type: 'preset', avatar_value: avatarValue })
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
    }
    reader.onerror = () => setError('头像读取失败')
    reader.readAsDataURL(file)
  }

  return (
    <section className="user-avatar-picker" aria-label="用户头像">
      <div className="user-avatar-picker-current">
        <UserAvatar
          avatarType={value.avatar_type}
          avatarValue={value.avatar_value}
          label={label || '用户'}
          size="lg"
        />
        <div>
          <span>头像</span>
          <strong>{value.avatar_type === 'upload' ? '自定义头像' : '内置动态头像'}</strong>
          <small>可选择系统头像，也可以上传使用人的照片或标识。</small>
        </div>
      </div>

      <div className="user-avatar-picker-presets" aria-label="内置头像">
        {avatarPresets.map((preset) => (
          <button
            aria-pressed={value.avatar_type === 'preset' && value.avatar_value === preset.id}
            className={value.avatar_type === 'preset' && value.avatar_value === preset.id ? 'selected' : ''}
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset.id)}
          >
            <UserAvatar avatarType="preset" avatarValue={preset.id} label={label || preset.label} size="sm" />
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      <div className="user-avatar-picker-upload-row">
        <label className="user-avatar-picker-upload">
          <input accept="image/*" type="file" onChange={handleFileChange} />
          <ImagePlus size={17} />
          <span>上传自定义头像</span>
        </label>
        <small>
          <Sparkles size={14} />
          {description}
        </small>
      </div>
      {error ? <p className="user-avatar-picker-error">{error}</p> : null}
    </section>
  )
}
