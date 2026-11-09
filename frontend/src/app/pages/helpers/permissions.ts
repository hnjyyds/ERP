import type { CurrentUser } from '@/api'

export const superAdminPermission = 'system:super_admin'

export function canCreateAnnouncement(user: CurrentUser) {
  return user.permissions.includes(superAdminPermission)
}

export function canApproveAssignedRecord(
  currentUser: CurrentUser,
  reviewerId: string | null | undefined,
  approvalPermission: string,
) {
  if (currentUser.permissions.includes(superAdminPermission)) return true
  if (reviewerId) return reviewerId === currentUser.id
  return currentUser.permissions.includes(approvalPermission)
}
