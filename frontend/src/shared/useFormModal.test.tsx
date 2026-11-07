import { act, renderHook } from '@testing-library/react'

import { useFormModal } from './useFormModal'

type DemoForm = { name: string }

const initialForm = (): DemoForm => ({ name: '' })

describe('useFormModal', () => {
  it('resets the form when opened or closed', () => {
    const { result } = renderHook(() => useFormModal(initialForm))

    act(() => result.current.openWith({ name: '草稿' }))
    expect(result.current.open).toBe(true)
    expect(result.current.form).toEqual({ name: '草稿' })

    act(() => result.current.close())
    expect(result.current.open).toBe(false)
    expect(result.current.form).toEqual({ name: '' })

    act(() => result.current.openWith())
    expect(result.current.form).toEqual({ name: '' })
  })

  it('resets the form after a successful submit', async () => {
    const { result } = renderHook(() => useFormModal(initialForm))
    const onError = vi.fn()

    act(() => result.current.openWith({ name: '采购询价' }))
    let succeeded = false
    await act(async () => {
      succeeded = await result.current.runSubmit(async () => undefined, onError)
    })

    expect(succeeded).toBe(true)
    expect(result.current.form).toEqual({ name: '' })
    expect(result.current.submitting).toBe(false)
    expect(onError).not.toHaveBeenCalled()
  })

  it('keeps the form data when submitting fails', async () => {
    const { result } = renderHook(() => useFormModal(initialForm))
    const onError = vi.fn()

    act(() => result.current.openWith({ name: '保留内容' }))
    let succeeded = true
    await act(async () => {
      succeeded = await result.current.runSubmit(async () => {
        throw new Error('save failed')
      }, onError)
    })

    expect(succeeded).toBe(false)
    expect(result.current.form).toEqual({ name: '保留内容' })
    expect(result.current.submitting).toBe(false)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('ignores a second submit while the first is pending', async () => {
    const { result } = renderHook(() => useFormModal(initialForm))
    const onError = vi.fn()
    let release: () => void = () => undefined
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    let first!: Promise<boolean>
    let second!: Promise<boolean>
    act(() => {
      first = result.current.runSubmit(() => pending, onError)
      second = result.current.runSubmit(async () => undefined, onError)
    })

    await act(async () => {
      await expect(second).resolves.toBe(false)
    })

    await act(async () => {
      release()
      await pending
    })

    await act(async () => {
      await expect(first).resolves.toBe(true)
    })
    expect(onError).not.toHaveBeenCalled()
  })
})
