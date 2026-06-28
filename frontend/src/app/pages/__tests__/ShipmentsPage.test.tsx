import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShipmentsPage } from '../sales/ShipmentsPage'

describe('ShipmentsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<ShipmentsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders shipment list panel', () => {
    render(<ShipmentsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('出货计划列表')).toBeTruthy()
  })
})
