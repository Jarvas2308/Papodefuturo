// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Asset, Purchase } from '../domain/models'
import * as useHistoryDataModule from '../features/history/useHistoryData'
import type { HistoryMovement } from '../features/history/types'
import { HistoryPage } from './HistoryPage'

const ASSET: Asset = {
  id: 'asset-hgru11',
  ticker: 'HGRU11',
  name: 'Pátria Renda Urbana',
  category: 'real-estate-fund',
  market: 'BR',
  status: 'active',
}

const PURCHASE: Purchase = {
  id: 'purchase-1',
  assetId: 'asset-hgru11',
  quantity: 10,
  unitPrice: { amountInMinorUnits: 12_000, currency: 'BRL' },
  totalAmount: { amountInMinorUnits: 120_000, currency: 'BRL' },
  tradeDate: '2026-07-01',
  status: 'confirmed',
}

const MOVEMENT: HistoryMovement = {
  id: 'purchase-1',
  date: '2026-07-01',
  type: 'purchase',
  assetId: 'asset-hgru11',
  ticker: 'HGRU11',
  assetName: 'Pátria Renda Urbana',
  category: 'real-estate-funds',
  quantity: 10,
  unitPriceInCents: 12_000,
  totalValueInCents: 120_000,
  currency: 'BRL',
  status: 'completed',
}

function mockHistoryData(
  overrides: Partial<ReturnType<typeof useHistoryDataModule.useHistoryData>> = {}
) {
  const base: ReturnType<typeof useHistoryDataModule.useHistoryData> = {
    assets: [ASSET],
    purchases: [PURCHASE],
    movements: [MOVEMENT],
    status: 'ready',
    error: null,
    isDemo: false,
    createPurchase: vi.fn().mockResolvedValue(undefined),
    updatePurchase: vi.fn().mockResolvedValue(undefined),
    cancelPurchase: vi.fn().mockResolvedValue(undefined),
  }
  const historyData = { ...base, ...overrides }
  vi.spyOn(useHistoryDataModule, 'useHistoryData').mockReturnValue(historyData)
  return historyData
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HistoryPage — cancelamento de compra', () => {
  it('abre a confirmação, chama cancelPurchase e mostra feedback de sucesso', async () => {
    const historyData = mockHistoryData()
    render(<HistoryPage />)

    const cancelButtons = screen.getAllByRole('button', {
      name: 'Cancelar compra',
    })
    await userEvent.click(cancelButtons[0]!)

    expect(
      screen.getByRole('alertdialog', { name: /Cancelar compra de HGRU11/ })
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar cancelamento' })
    )

    await waitFor(() => {
      expect(historyData.cancelPurchase).toHaveBeenCalledWith('purchase-1')
    })
    expect(
      screen.queryByRole('alertdialog')
    ).not.toBeInTheDocument()
    expect(
      await screen.findByText(/Compra cancelada/)
    ).toBeInTheDocument()
  })

  it('fecha a confirmação sem cancelar ao clicar em Voltar', async () => {
    const historyData = mockHistoryData()
    render(<HistoryPage />)

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Cancelar compra' })[0]!
    )
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(historyData.cancelPurchase).not.toHaveBeenCalled()
  })

  it('mostra a mensagem de erro do repositório quando o cancelamento falha', async () => {
    const historyData = mockHistoryData({
      cancelPurchase: vi
        .fn()
        .mockRejectedValue(new Error('Somente compras confirmadas podem ser canceladas.')),
    })
    render(<HistoryPage />)

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Cancelar compra' })[0]!
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar cancelamento' })
    )

    expect(
      await screen.findByText(
        'Somente compras confirmadas podem ser canceladas.'
      )
    ).toBeInTheDocument()
    // Ao contrário do fluxo de sucesso, a confirmação permanece aberta no
    // erro - o usuário vê a mensagem e decide tentar de novo ou voltar.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('não mostra ações de cancelamento em modo demo', () => {
    mockHistoryData({ isDemo: true })
    render(<HistoryPage />)

    expect(
      screen.queryByRole('button', { name: 'Cancelar compra' })
    ).not.toBeInTheDocument()
  })
})
