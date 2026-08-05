import type { ShillerCapeFetcher } from './types'

// Fonte academica primaria (Robert Shiller, Yale) - sem HTTPS disponivel
// nesse host (confirmado: conexao TLS falha, so HTTP funciona). Diferente
// de CVM/SEC (que sempre respondem em HTTPS), essa e' uma limitacao real
// do servidor academico, nao uma escolha deste projeto - aceito porque o
// conteudo e' publico e nao sensivel (mesmo dado que qualquer usuario da
// web ve sem autenticacao), mesmo criterio de "sem credencial, sem dado
// pessoal" ja aplicado aos demais downloads publicos deste projeto.
export const SHILLER_CAPE_URL =
  'http://www.econ.yale.edu/~shiller/data/ie_data.xls'

export async function downloadShillerCapeArchive(
  fetcher: ShillerCapeFetcher = fetch
): Promise<ArrayBuffer> {
  const response = await fetcher(SHILLER_CAPE_URL)
  if (!response.ok) {
    throw new Error(
      `Failed to download Shiller CAPE data: HTTP ${response.status}`
    )
  }

  return response.arrayBuffer()
}
