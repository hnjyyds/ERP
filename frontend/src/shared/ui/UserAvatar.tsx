import type { ReactNode } from 'react'

import type { UserAvatarType } from '../../api'

export type AvatarPresetId =
  | 'amber-orbit'
  | 'sage-pulse'
  | 'copper-wave'
  | 'blueprint-grid'
  | 'ink-halo'
  | 'rose-signal'

export const defaultAvatarPreset: AvatarPresetId = 'amber-orbit'

export const avatarPresets: Array<{ id: AvatarPresetId; label: string }> = [
  { id: 'amber-orbit', label: '琥珀轨道' },
  { id: 'sage-pulse', label: '青石脉冲' },
  { id: 'copper-wave', label: '铜色波纹' },
  { id: 'blueprint-grid', label: '蓝图网格' },
  { id: 'ink-halo', label: '墨色光环' },
  { id: 'rose-signal', label: '玫瑰信号' },
]

type UserAvatarProps = {
  avatarType?: UserAvatarType
  avatarValue?: string
  label: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function initials(label: string) {
  const trimmed = label.trim()
  if (!trimmed) return 'U'
  return trimmed.slice(0, 1).toUpperCase()
}

function avatarInner(presetId: string, label: string): ReactNode {
  if (presetId === 'blueprint-grid') {
    return (
      <>
        <span className="app-avatar-grid" />
        <span className="app-avatar-initial">{initials(label)}</span>
      </>
    )
  }
  if (presetId === 'copper-wave') {
    return (
      <>
        <span className="app-avatar-wave" />
        <span className="app-avatar-initial">{initials(label)}</span>
      </>
    )
  }
  if (presetId === 'sage-pulse') {
    return (
      <>
        <span className="app-avatar-pulse" />
        <span className="app-avatar-initial">{initials(label)}</span>
      </>
    )
  }
  if (presetId === 'ink-halo') {
    return (
      <>
        <span className="app-avatar-halo" />
        <span className="app-avatar-initial">{initials(label)}</span>
      </>
    )
  }
  if (presetId === 'rose-signal') {
    return (
      <>
        <span className="app-avatar-signal" />
        <span className="app-avatar-initial">{initials(label)}</span>
      </>
    )
  }
  return (
    <>
      <span className="app-avatar-orbit" />
      <span className="app-avatar-initial">{initials(label)}</span>
    </>
  )
}

export function UserAvatar({
  avatarType = 'preset',
  avatarValue = defaultAvatarPreset,
  className = '',
  label,
  size = 'md',
}: UserAvatarProps) {
  const shouldUseImage = avatarType === 'upload' && avatarValue.startsWith('data:image/')
  const preset = shouldUseImage ? defaultAvatarPreset : avatarValue || defaultAvatarPreset
  const classes = ['app-avatar', `app-avatar-${size}`, `app-avatar-${preset}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span aria-label={`${label} 的头像`} className={classes} role="img">
      {shouldUseImage ? <img alt="" src={avatarValue} /> : avatarInner(preset, label)}
    </span>
  )
}
