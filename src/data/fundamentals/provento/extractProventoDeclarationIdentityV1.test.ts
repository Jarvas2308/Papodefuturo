import { describe, expect, it } from 'vitest'
import { extractProventoDeclarationIdentityV1 } from './extractProventoDeclarationIdentityV1'

// Trechos reais extraídos de documentos "Provento" da CVM (baixados e
// inspecionados nesta sessão, não inventados) - só as linhas relevantes ao
// redor do cabeçalho, o parser real não depende do resto do documento.
const ITSA4_VERSION_1 = `
Data Aprovação Ultimo dia de negociação com Direitos
10/02/2025 28/11/2025
Protocolo Provento Versão Data Envio
1332829 1 10/02/2025
Código ISIN Valor Bruto
`

const ITSA4_VERSION_2 = `
Data Aprovação Ultimo dia de negociação com Direitos
10/02/2025 29/08/2025
Protocolo Provento Versão Data Envio
1332829 2 10/02/2025
Código ISIN Valor Bruto
`

const BBAS3 = `
18/02/2025 11/03/2025
Protocolo Provento Versão Data Envio
1336848 1 19/02/2025
Código ISIN Valor Bruto
`

describe('extractProventoDeclarationIdentityV1', () => {
  it('extrai protocolo, versão e data de envio de um documento real', () => {
    expect(extractProventoDeclarationIdentityV1(BBAS3)).toEqual({
      protocol: '1336848',
      version: 1,
      sentAt: '19/02/2025',
    })
  })

  it('duas submissões ENET distintas compartilham o mesmo Protocolo Provento com versão incrementada', () => {
    const v1 = extractProventoDeclarationIdentityV1(ITSA4_VERSION_1)
    const v2 = extractProventoDeclarationIdentityV1(ITSA4_VERSION_2)

    expect(v1).toEqual({
      protocol: '1332829',
      version: 1,
      sentAt: '10/02/2025',
    })
    expect(v2).toEqual({
      protocol: '1332829',
      version: 2,
      sentAt: '10/02/2025',
    })
    expect(v1?.protocol).toBe(v2?.protocol)
    expect(v1?.version).not.toBe(v2?.version)
  })

  it('falha fechado quando a linha de cabeçalho não existe', () => {
    expect(
      extractProventoDeclarationIdentityV1('documento sem a tabela')
    ).toBeNull()
  })

  it('falha fechado quando a linha de valor não bate no formato esperado', () => {
    const malformed = `
Protocolo Provento Versão Data Envio
texto inesperado aqui
`
    expect(extractProventoDeclarationIdentityV1(malformed)).toBeNull()
  })

  it('falha fechado quando o cabeçalho é a última linha não vazia', () => {
    const truncated = `
Protocolo Provento Versão Data Envio
`
    expect(extractProventoDeclarationIdentityV1(truncated)).toBeNull()
  })
})
