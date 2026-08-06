export type FredDfii10Rate = {
  series: 'fred-dfii10'
  rateScaled: number
  rateScale: 1000000
  pricedAt: string
  source: 'fred'
}

const OBSERVATIONS_URL = 'https://api.stlouisfed.org/fred/series/observations'

// FRED publica dias uteis; feriados e fins de semana ficam ausentes, nunca
// "." (esse marcador so aparece dentro de uma serie continua para um dado
// pontual faltante, o que nao e' o caso de DFII10). Ainda assim, pedir mais
// de 1 observacao e' defensivo: se a mais recente vier "." por algum motivo
// real, a proxima mais recente ainda serve.
const OBSERVATION_LIMIT = 10

type FredObservation = {
  date: string
  value: string
}

type FredObservationsResponse = {
  observations?: FredObservation[]
}

const SIGNED_DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/

// DFII10 e' rendimento real e pode ser negativo (ja aconteceu
// historicamente) - diferente de decimalToExchangeRateScaled (usado para
// preco, cambio e a taxa NTN-B), que so aceita valores positivos por
// contrato. Escala identica (6 casas), meio-para-cima no ultimo digito
// descartado, mas sem a restricao de sinal.
export function parseFredDfii10Percent(value: string): number {
  const normalized = value.trim()

  if (!SIGNED_DECIMAL_PATTERN.test(normalized)) {
    throw new RangeError('FRED observation value has an invalid format')
  }

  const isNegative = normalized.startsWith('-')
  const unsigned = isNegative ? normalized.slice(1) : normalized
  const [integerPart, fractionPart = ''] = unsigned.split('.')
  const keptFraction = fractionPart.slice(0, 6).padEnd(6, '0')
  const firstDiscardedDigit = fractionPart[6]

  let scaled = BigInt(integerPart) * 1_000_000n + BigInt(keptFraction || '0')

  if (firstDiscardedDigit && firstDiscardedDigit >= '5') {
    scaled += 1n
  }

  const signedScaled = isNegative ? -scaled : scaled

  if (
    signedScaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    signedScaled < -BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError('FRED observation value is outside the safe range')
  }

  return Number(signedScaled)
}

export function selectLatestFredObservation(
  observations: readonly FredObservation[]
): FredObservation {
  const withValue = observations.filter((observation) => {
    return observation.value.trim() !== '.'
  })

  if (withValue.length === 0) {
    throw new RangeError('Nenhuma observação com valor publicado no FRED.')
  }

  return withValue.reduce((latest, observation) =>
    observation.date > latest.date ? observation : latest
  )
}

export function parseFredDfii10Rate(
  payload: FredObservationsResponse
): FredDfii10Rate {
  const observations = payload.observations ?? []

  if (observations.length === 0) {
    throw new RangeError('Resposta do FRED sem observações.')
  }

  const selected = selectLatestFredObservation(observations)

  return {
    series: 'fred-dfii10',
    rateScaled: parseFredDfii10Percent(selected.value),
    rateScale: 1_000_000,
    pricedAt: selected.date,
    source: 'fred',
  }
}

type FetchLike = typeof fetch

export type FredProvider = {
  getDfii10Rate(): Promise<FredDfii10Rate>
}

export function createFredProvider(
  apiKey: string,
  fetchImplementation: FetchLike = fetch
): FredProvider {
  return {
    async getDfii10Rate() {
      const url = new URL(OBSERVATIONS_URL)
      url.searchParams.set('series_id', 'DFII10')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('file_type', 'json')
      url.searchParams.set('sort_order', 'desc')
      url.searchParams.set('limit', String(OBSERVATION_LIMIT))

      const response = await fetchImplementation(url.toString())

      if (!response.ok) {
        throw new Error(`FRED respondeu ${response.status} ao buscar DFII10.`)
      }

      const payload = (await response.json()) as FredObservationsResponse
      return parseFredDfii10Rate(payload)
    },
  }
}
