import { Button, Modal } from 'antd'
import type { FormEvent, ReactNode } from 'react'

import { t } from '../../app/appI18n'

type FormModalProps = {
  open: boolean
  title: ReactNode
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: ReactNode
  children: ReactNode
  submitting?: boolean
  cancelLabel?: ReactNode
  submitDanger?: boolean
  submitType?: 'primary' | 'default'
  centered?: boolean
  destroyOnHidden?: boolean
  width?: number | string
}

/** 统一的表单弹窗壳：标题、字段区、取消/提交按钮与提交中状态。 */
export function FormModal({
  open,
  title,
  onCancel,
  onSubmit,
  submitLabel,
  children,
  submitting = false,
  cancelLabel,
  submitDanger = false,
  submitType = 'default',
  centered = false,
  destroyOnHidden = false,
  width,
}: FormModalProps) {
  return (
    <Modal
      centered={centered}
      destroyOnHidden={destroyOnHidden}
      footer={null}
      open={open}
      title={title}
      width={width}
      onCancel={onCancel}
    >
      <form className="record-form" onSubmit={onSubmit}>
        {children}
        <div className="modal-actions">
          <Button onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</Button>
          <Button danger={submitDanger} htmlType="submit" loading={submitting} type={submitType}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
