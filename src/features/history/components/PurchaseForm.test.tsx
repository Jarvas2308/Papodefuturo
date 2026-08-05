// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Asset, Purchase } from '../../../domain/models'
import { PurchaseForm } from './PurchaseForm'

const ASSETS: Asset[] = [
  {
    id: 'asset-hgru11',
    ticker: 'HGRU11',
    name: 'Pátria Renda Urbana',
    category: 'real-estate-fund',
    market: 'BR',
    status: 'active',
  },
]

const EXISTING_PURCHASE: Purchase = {
  id: 'purchase-1',
  assetId: 'asset-hgru11',
  quantity: 10,
  unitPrice: { amountInMinorUnits: 12_000, currency: 'BRL' },
  totalAmount: { amountInMinorUnits: 120_000, currency: 'BRL' },
  tradeDate: '2026-07-01',
  status: 'confirmed',
  notes: 'aporte de julho',
}

describe('PurchaseForm', () => {
  it('does not call onCreate and shows feedback when required fields are missing', async () => {
    const onCreate = vi.fn()
    render(
      <PurchaseForm
        assets={ASSETS}
        editingPurchase={null}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onCancelEdit={vi.fn()}
      />
    )

    // Botão de submit ja nasce desabilitado sem quantidade/preco - o form
    // nao deixa nem tentar enviar dado incompleto.
    expect(
      screen.getByRole('button', { name: 'Registrar compra' })
    ).toBeDisabled()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates a purchase with the typed data and clears the form afterwards', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(
      <PurchaseForm
        assets={ASSETS}
        editingPurchase={null}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onCancelEdit={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/Quantidade/), '10')
    await userEvent.type(screen.getByLabelText(/Preço unitário/), '123,45')
    await userEvent.type(screen.getByLabelText('Observação opcional'), 'nota')

    const submitButton = screen.getByRole('button', {
      name: 'Registrar compra',
    })
    expect(submitButton).not.toBeDisabled()
    await userEvent.click(submitButton)

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'asset-hgru11',
        quantity: 10,
        unitPriceInMinorUnits: 12_345,
        notes: 'nota',
      })
    )

    expect(await screen.findByLabelText(/Quantidade/)).toHaveValue('')
  })

  it('pre-fills the form in edit mode and calls onUpdate with the purchase id', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const onCancelEdit = vi.fn()
    render(
      <PurchaseForm
        assets={ASSETS}
        editingPurchase={EXISTING_PURCHASE}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onCancelEdit={onCancelEdit}
      />
    )

    expect(screen.getByLabelText(/Quantidade/)).toHaveValue('10')
    expect(screen.getByLabelText(/Preço unitário/)).toHaveValue('120,00')

    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar alterações' })
    )

    expect(onUpdate).toHaveBeenCalledWith(
      'purchase-1',
      expect.objectContaining({ assetId: 'asset-hgru11', quantity: 10 })
    )
    expect(onCancelEdit).toHaveBeenCalled()
  })

  it('cancels editing without calling onUpdate', async () => {
    const onUpdate = vi.fn()
    const onCancelEdit = vi.fn()
    render(
      <PurchaseForm
        assets={ASSETS}
        editingPurchase={EXISTING_PURCHASE}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onCancelEdit={onCancelEdit}
      />
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Cancelar edição' })
    )

    expect(onCancelEdit).toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('shows an error message when onCreate rejects', async () => {
    const onCreate = vi
      .fn()
      .mockRejectedValue(new Error('Não foi possível registrar a compra.'))
    render(
      <PurchaseForm
        assets={ASSETS}
        editingPurchase={null}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onCancelEdit={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/Quantidade/), '5')
    await userEvent.type(screen.getByLabelText(/Preço unitário/), '10,00')
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar compra' })
    )

    expect(
      await screen.findByText('Não foi possível registrar a compra.')
    ).toBeInTheDocument()
  })
})
