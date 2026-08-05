import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Sem `globals: true` no vitest.config, a limpeza automatica do Testing
// Library (que depende de um `afterEach` global) nao dispara sozinha -
// registrar aqui, uma vez, para todo teste de interacao.
afterEach(() => {
  cleanup()
})
