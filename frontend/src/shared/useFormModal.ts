import { useRef, useState, type Dispatch, type SetStateAction } from 'react'

export type FormModalController<T> = {
  open: boolean
  form: T
  setForm: Dispatch<SetStateAction<T>>
  submitting: boolean
  openWith: (next?: T) => void
  close: () => void
  runSubmit: (action: () => Promise<void>, onError: (caught: unknown) => void) => Promise<boolean>
}

export function useFormModal<T>(createInitial: () => T): FormModalController<T> {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<T>(createInitial)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  function openWith(next?: T) {
    setForm(next ?? createInitial())
    setOpen(true)
  }

  function close() {
    setForm(createInitial())
    setOpen(false)
  }

  async function runSubmit(
    action: () => Promise<void>,
    onError: (caught: unknown) => void,
  ): Promise<boolean> {
    if (submittingRef.current) return false
    submittingRef.current = true
    setSubmitting(true)
    try {
      await action()
      setForm(createInitial())
      return true
    } catch (caught) {
      onError(caught)
      return false
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return { open, form, setForm, submitting, openWith, close, runSubmit }
}
