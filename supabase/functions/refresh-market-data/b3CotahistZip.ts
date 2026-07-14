import { unzipSync } from 'npm:fflate@0.8.2'

export function extractCotahistText(archive: Uint8Array): string {
  let files: Record<string, Uint8Array>

  try {
    files = unzipSync(archive)
  } catch {
    throw new Error('Arquivo ZIP COTAHIST inválido.')
  }

  const entry = Object.entries(files).find(([name]) =>
    name.toUpperCase().endsWith('.TXT')
  )

  if (!entry) {
    throw new Error('Arquivo ZIP COTAHIST não contém um TXT válido.')
  }

  return new TextDecoder('windows-1252').decode(entry[1])
}
