// Reduz o HTML de um documento EDGAR ao texto corrido que o extrator de
// "Financial Highlights" consome (DEC-103).
//
// O N-CSR da Vanguard é HTML de composição gráfica: cada célula da tabela
// é uma `<td>` com `<span>`/`<font>` dentro, e o espaçamento vem de
// entidades (`&nbsp;`, `&#8194;`) e não de espaços literais. Nada disso é
// informação — o que interessa é a sequência de rótulos e valores na
// ordem em que aparecem no documento. Esta função não interpreta nada,
// só normaliza:
//
// - remove comentários e blocos `<script>`/`<style>` inteiros;
// - troca cada tag por um espaço (nunca concatena o texto de duas
//   células vizinhas em um token só);
// - decodifica as entidades que a fonte realmente usa;
// - colapsa qualquer sequência de espaço em branco em um único espaço.
//
// Falha fechada não se aplica aqui: a função é puramente textual e
// determinística. Toda a validação semântica fica no extrator.

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

function decodeEntities(value: string): string {
  return value.replace(
    /&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g,
    (match, body: string) => {
      if (body.startsWith('#x') || body.startsWith('#X')) {
        const codePoint = Number.parseInt(body.slice(2), 16)
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
      }
      if (body.startsWith('#')) {
        const codePoint = Number.parseInt(body.slice(1), 10)
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
      }
      return NAMED_ENTITIES[body] ?? match
    }
  )
}

export function normalizeSecDocumentTextV1(html: string): string {
  const withoutScripts = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

  const withoutTags = withoutScripts.replace(/<[^>]*>/g, ' ')

  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim()
}
