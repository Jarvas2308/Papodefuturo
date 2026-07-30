import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StrategyToolbar } from './StrategyToolbar'

function render(isDemo: boolean) {
  return renderToStaticMarkup(
    <StrategyToolbar
      isEditing={false}
      isValid
      hasChanges={false}
      isDemo={isDemo}
      onEdit={() => {}}
      onApply={() => {}}
      onCancel={() => {}}
      onRestore={() => {}}
    />
  )
}

describe('StrategyToolbar', () => {
  it('promises no persistence only in demo mode', () => {
    const markup = render(true)

    expect(markup).toContain('Configuração demonstrativa')
    expect(markup).toContain('não são persistidas')
  })

  it('never calls a real session demonstrative', () => {
    // A estratégia real é gravada em allocation_targets por saveStrategy. O
    // texto fixo de demonstração fazia o usuário concluir que nada tinha sido
    // salvo, mesmo depois de a gravação ter ocorrido.
    const markup = render(false)

    expect(markup).not.toContain('demonstrativa')
    expect(markup).not.toContain('não são persistidas')
    expect(markup).toContain('Configuração da sua conta')
    expect(markup).toContain('salvas na sua conta')
  })
})
