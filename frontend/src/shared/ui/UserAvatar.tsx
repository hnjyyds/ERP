import type { ReactNode } from 'react'

import type { UserAvatarType } from '@/api'
import { t, type TranslationKey } from '@/app/appI18n'

type PersonAvatarPresetId =
  | 'person-tech-01'
  | 'person-tech-02'
  | 'person-tech-03'
  | 'person-tech-04'
  | 'person-tech-05'
  | 'person-tech-06'
  | 'person-tech-07'
  | 'person-tech-08'
  | 'person-tech-09'
  | 'person-tech-10'
  | 'person-tech-11'
  | 'person-tech-12'
  | 'person-tech-13'
  | 'person-tech-14'
  | 'person-business-01'
  | 'person-business-02'
  | 'person-business-03'
  | 'person-business-04'
  | 'person-business-05'
  | 'person-business-06'
  | 'person-business-07'
  | 'person-business-08'

type EmojiAvatarPresetId =
  | 'emoji-smile'
  | 'emoji-wave'
  | 'emoji-focus'
  | 'emoji-star'
  | 'emoji-check'
  | 'emoji-coffee'
  | 'emoji-rocket'
  | 'emoji-sun'

export type AvatarPresetId = PersonAvatarPresetId | EmojiAvatarPresetId

export type AvatarPresetCategory = 'person' | 'emoji'

export type AvatarPreset = {
  id: AvatarPresetId
  labelKey: TranslationKey
  category: AvatarPresetCategory
  groupKey: TranslationKey
  variant?: number
  emoji?: string
}

export const defaultAvatarPreset: PersonAvatarPresetId = 'person-tech-01'

export const avatarPresets: AvatarPreset[] = [
  { id: 'person-tech-01', labelKey: 'common.avatar.preset.personTech01', category: 'person', groupKey: 'common.avatar.group.tech', variant: 1 },
  { id: 'person-tech-02', labelKey: 'common.avatar.preset.personTech02', category: 'person', groupKey: 'common.avatar.group.tech', variant: 2 },
  { id: 'person-tech-03', labelKey: 'common.avatar.preset.personTech03', category: 'person', groupKey: 'common.avatar.group.tech', variant: 3 },
  { id: 'person-tech-04', labelKey: 'common.avatar.preset.personTech04', category: 'person', groupKey: 'common.avatar.group.tech', variant: 4 },
  { id: 'person-tech-05', labelKey: 'common.avatar.preset.personTech05', category: 'person', groupKey: 'common.avatar.group.tech', variant: 5 },
  { id: 'person-tech-06', labelKey: 'common.avatar.preset.personTech06', category: 'person', groupKey: 'common.avatar.group.tech', variant: 6 },
  { id: 'person-tech-07', labelKey: 'common.avatar.preset.personTech07', category: 'person', groupKey: 'common.avatar.group.tech', variant: 7 },
  { id: 'person-tech-08', labelKey: 'common.avatar.preset.personTech08', category: 'person', groupKey: 'common.avatar.group.tech', variant: 8 },
  { id: 'person-tech-09', labelKey: 'common.avatar.preset.personTech09', category: 'person', groupKey: 'common.avatar.group.tech', variant: 9 },
  { id: 'person-tech-10', labelKey: 'common.avatar.preset.personTech10', category: 'person', groupKey: 'common.avatar.group.tech', variant: 10 },
  { id: 'person-tech-11', labelKey: 'common.avatar.preset.personTech11', category: 'person', groupKey: 'common.avatar.group.tech', variant: 11 },
  { id: 'person-tech-12', labelKey: 'common.avatar.preset.personTech12', category: 'person', groupKey: 'common.avatar.group.tech', variant: 12 },
  { id: 'person-tech-13', labelKey: 'common.avatar.preset.personTech13', category: 'person', groupKey: 'common.avatar.group.tech', variant: 13 },
  { id: 'person-tech-14', labelKey: 'common.avatar.preset.personTech14', category: 'person', groupKey: 'common.avatar.group.tech', variant: 14 },
  { id: 'person-business-01', labelKey: 'common.avatar.preset.personBusiness01', category: 'person', groupKey: 'common.avatar.group.business', variant: 15 },
  { id: 'person-business-02', labelKey: 'common.avatar.preset.personBusiness02', category: 'person', groupKey: 'common.avatar.group.business', variant: 16 },
  { id: 'person-business-03', labelKey: 'common.avatar.preset.personBusiness03', category: 'person', groupKey: 'common.avatar.group.business', variant: 17 },
  { id: 'person-business-04', labelKey: 'common.avatar.preset.personBusiness04', category: 'person', groupKey: 'common.avatar.group.business', variant: 18 },
  { id: 'person-business-05', labelKey: 'common.avatar.preset.personBusiness05', category: 'person', groupKey: 'common.avatar.group.business', variant: 19 },
  { id: 'person-business-06', labelKey: 'common.avatar.preset.personBusiness06', category: 'person', groupKey: 'common.avatar.group.business', variant: 20 },
  { id: 'person-business-07', labelKey: 'common.avatar.preset.personBusiness07', category: 'person', groupKey: 'common.avatar.group.business', variant: 21 },
  { id: 'person-business-08', labelKey: 'common.avatar.preset.personBusiness08', category: 'person', groupKey: 'common.avatar.group.business', variant: 22 },
  { id: 'emoji-smile', labelKey: 'common.avatar.preset.emojiSmile', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '🙂' },
  { id: 'emoji-wave', labelKey: 'common.avatar.preset.emojiWave', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '👋' },
  { id: 'emoji-focus', labelKey: 'common.avatar.preset.emojiFocus', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '🧐' },
  { id: 'emoji-star', labelKey: 'common.avatar.preset.emojiStar', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '⭐' },
  { id: 'emoji-check', labelKey: 'common.avatar.preset.emojiCheck', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '✅' },
  { id: 'emoji-coffee', labelKey: 'common.avatar.preset.emojiCoffee', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '☕' },
  { id: 'emoji-rocket', labelKey: 'common.avatar.preset.emojiRocket', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '🚀' },
  { id: 'emoji-sun', labelKey: 'common.avatar.preset.emojiSun', category: 'emoji', groupKey: 'common.avatar.group.emoji', emoji: '☀️' },
]

type UserAvatarProps = {
  avatarType?: UserAvatarType
  avatarValue?: string
  label: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function resolveAvatarPreset(presetId?: string): AvatarPreset {
  const normalized = presetId || defaultAvatarPreset
  return avatarPresets.find((preset) => preset.id === normalized) ?? avatarPresets[0]
}

function PersonAvatar({ variant = 1 }: { variant?: number }) {
  const hasGlasses = [1, 2, 3, 7, 8, 9, 13, 14, 18, 22].includes(variant)
  const hasBeard = [5, 10, 12, 20].includes(variant)
  const hasHeadset = [8, 13, 17, 18].includes(variant)
  const hasCap = [6, 11, 20].includes(variant)
  const hasLongHair = variant >= 15 && !hasCap
  const hasTie = [7, 19, 21, 22].includes(variant)
  const hasTablet = [12, 17].includes(variant)
  const isCurly = [1, 5, 10, 21].includes(variant)

  return (
    <svg aria-hidden="true" className="app-avatar-portrait" focusable="false" viewBox="0 0 64 64">
      <path
        d="M13 57c2.8-10.8 10-17.2 19-17.2S48.2 46.2 51 57H13Z"
        fill="currentColor"
      />
      {hasLongHair ? (
        <path
          d="M18.8 34.4c-3.7-11 2.9-20.8 13.3-20.8 10.8 0 17.2 9.8 13 20.9-1.9 5.2-2.5 8.3.9 12.8-8.4.7-20.1.8-28.3 0 3.3-4.7 2.8-7.8 1.1-12.9Z"
          fill="currentColor"
        />
      ) : null}
      <circle cx="32" cy="29" fill="#fffdf8" r="11.5" stroke="currentColor" strokeWidth="2" />
      {isCurly ? (
        <>
          <circle cx="23.4" cy="22.8" fill="currentColor" r="4.7" />
          <circle cx="29" cy="18.5" fill="currentColor" r="5" />
          <circle cx="35.4" cy="18.8" fill="currentColor" r="4.8" />
          <circle cx="41" cy="23.5" fill="currentColor" r="4.3" />
        </>
      ) : null}
      {!isCurly && !hasCap && !hasLongHair ? (
        <path
          d="M20.6 27.7c1-8.4 6-12.8 13.1-12.2 6.4.5 9.4 4.6 10.2 11.2-5.4-3.8-14.9-4.5-23.3 1Z"
          fill="currentColor"
        />
      ) : null}
      {hasLongHair ? (
        <path
          d="M22.2 27.2c2.4-6.2 7.5-9.1 12.5-8.1 3.9.8 6.4 3.9 7.3 7.8-6.4-3.5-12.3-3.8-19.8.3Z"
          fill="currentColor"
        />
      ) : null}
      {hasCap ? (
        <>
          <path
            d="M20.7 24.5c2.2-6 6.2-9.1 11.8-9.1 5.2 0 9.4 3 11.1 9.1H20.7Z"
            fill="currentColor"
          />
          <path
            d="M18.6 25.8c6.7-1.3 17.8-1.4 27 .1"
            fill="none"
            stroke="#fffdf8"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </>
      ) : null}
      <path d="M27.6 30.3h.1M36.4 30.3h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      {hasGlasses ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="27.4" cy="30" r="4" />
          <circle cx="36.6" cy="30" r="4" />
          <path d="M31.5 30h1" />
        </g>
      ) : null}
      <path d="M29.3 35.6c1.8 1.4 3.8 1.4 5.6 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      {hasBeard ? <path d="M25.4 35.2c2 5 11.7 5 13.7 0-2.7 2.1-11.1 2.2-13.7 0Z" fill="currentColor" /> : null}
      {hasHeadset ? (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2">
          <path d="M20.8 29c0-8 4.7-13.2 11.2-13.2S43.2 21 43.2 29" />
          <path d="M19.2 31.5v5.4M44.8 31.5v5.4" />
        </g>
      ) : null}
      <path d="M23.4 47.6c4.5 2.9 12.6 2.9 17.2 0" fill="none" stroke="#fffdf8" strokeLinecap="round" strokeWidth="2" />
      {hasTie ? (
        <path d="M31.8 43.1 28.7 57h6.4l-3.3-13.9Z" fill="#fffdf8" opacity="0.92" />
      ) : null}
      {hasTablet ? (
        <rect
          fill="#fffdf8"
          height="15.5"
          rx="2.2"
          stroke="currentColor"
          strokeWidth="1.7"
          transform="rotate(-7 47 45)"
          width="10.5"
          x="41.8"
          y="38.8"
        />
      ) : null}
    </svg>
  )
}

function avatarInner(preset: AvatarPreset): ReactNode {
  if (preset.category === 'emoji') {
    return <span className="app-avatar-emoji-glyph">{preset.emoji}</span>
  }

  return <PersonAvatar variant={preset.variant} />
}

export function UserAvatar({
  avatarType = 'preset',
  avatarValue = defaultAvatarPreset,
  className = '',
  label,
  size = 'md',
}: UserAvatarProps) {
  const shouldUseImage = avatarType === 'upload' && avatarValue.startsWith('data:image/')
  const preset = resolveAvatarPreset(shouldUseImage ? defaultAvatarPreset : avatarValue)
  const classes = [
    'app-avatar',
    `app-avatar-${size}`,
    `app-avatar-${preset.category}`,
    `app-avatar-${preset.id}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      aria-label={t('common.avatar.ariaLabel', {
        name: label || t('common.avatar.picker.userPlaceholder'),
      })}
      className={classes}
      role="img"
    >
      {shouldUseImage ? <img alt="" src={avatarValue} /> : avatarInner(preset)}
    </span>
  )
}
