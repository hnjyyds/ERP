import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { RemoteSelect } from '@/shared/ui/RemoteSelect'
it('acceptance: selection forwards business option for invoice name/code backfill', async () => {
 const option = { value: 'supplier-a', label: '供应商验收A', description: 'S-A' }
 const change = vi.fn()
 render(<RemoteSelect fetchOptions={async () => [option]} value={null} onChange={change} ariaLabel="验收供应商" />)
 fireEvent.mouseDown(screen.getByRole('combobox'))
 fireEvent.click(await screen.findByText('供应商验收A'))
 await waitFor(() => expect(change).toHaveBeenCalled())
 console.log('ACTUAL_CALLBACK', JSON.stringify(change.mock.calls))
 expect(change).toHaveBeenLastCalledWith('supplier-a', option)
})
