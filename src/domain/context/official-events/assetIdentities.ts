import {
  assertNonEmptyString,
  cloneAssetIdentity,
  encodeIdentityComponent,
} from './internal'
import {
  OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
  type OfficialEventAssetIdentityV1,
} from './types'

const ASSET_IDENTITIES = [
  {
    category: 'brazilian-stock',
    market: 'BR',
    ticker: 'BBAS3',
    officialName: 'BCO BRASIL S.A.',
    cnpj: '00000000000191',
    cvmCode: '001023',
    regulatoryIdentityKey: 'cvm:company:001023:00000000000191',
  },
  {
    category: 'brazilian-stock',
    market: 'BR',
    ticker: 'ITSA4',
    officialName: 'ITAÚSA S.A.',
    cnpj: '61532644000115',
    cvmCode: '007617',
    regulatoryIdentityKey: 'cvm:company:007617:61532644000115',
  },
  {
    category: 'brazilian-stock',
    market: 'BR',
    ticker: 'TAEE11',
    officialName: 'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
    cnpj: '07859971000130',
    cvmCode: '020257',
    regulatoryIdentityKey: 'cvm:company:020257:07859971000130',
  },
  {
    category: 'brazilian-stock',
    market: 'BR',
    ticker: 'WEGE3',
    officialName: 'WEG S.A.',
    cnpj: '84429695000111',
    cvmCode: '005410',
    regulatoryIdentityKey: 'cvm:company:005410:84429695000111',
  },
  {
    category: 'brazilian-stock',
    market: 'BR',
    ticker: 'PSSA3',
    officialName: 'PORTO SEGURO S.A.',
    cnpj: '02149205000169',
    cvmCode: '016659',
    regulatoryIdentityKey: 'cvm:company:016659:02149205000169',
  },
  {
    category: 'real-estate-fund',
    market: 'BR',
    ticker: 'KNRI11',
    officialName: 'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
    cnpj: '12005956000165',
    isin: 'BRKNRICTF007',
    regulatoryIdentityKey: 'cvm:fund:12005956000165:BRKNRICTF007',
  },
  {
    category: 'real-estate-fund',
    market: 'BR',
    ticker: 'VISC11',
    officialName:
      'VINCI SHOPPING CENTERS FUNDO DE INVESTIMENTO IMOBILIÁRIO-FII',
    cnpj: '17554274000125',
    isin: 'BRVISCCTF005',
    regulatoryIdentityKey: 'cvm:fund:17554274000125:BRVISCCTF005',
  },
  {
    category: 'real-estate-fund',
    market: 'BR',
    ticker: 'XPLG11',
    officialName: 'XP LOG FII RL',
    cnpj: '26502794000185',
    isin: 'BRXPLGCTF002',
    regulatoryIdentityKey: 'cvm:fund:26502794000185:BRXPLGCTF002',
  },
  {
    category: 'real-estate-fund',
    market: 'BR',
    ticker: 'HGRU11',
    officialName: 'PÁTRIA RENDA URBANA - FUNDO DE INVESTIMENTO IMOBILIÁRIO',
    cnpj: '29641226000153',
    isin: 'BRHGRUCTF002',
    regulatoryIdentityKey: 'cvm:fund:29641226000153:BRHGRUCTF002',
  },
  {
    category: 'international-etf',
    market: 'US',
    ticker: 'VOO',
    officialName: 'VANGUARD INDEX FUNDS',
    registrantCik: '0000036405',
    seriesId: 'S000002839',
    classContractId: 'C000092055',
    regulatoryIdentityKey: 'sec:series-class:0000036405:S000002839:C000092055',
  },
  {
    category: 'international-etf',
    market: 'US',
    ticker: 'VNQ',
    officialName: 'VANGUARD SPECIALIZED FUNDS',
    registrantCik: '0000734383',
    seriesId: 'S000002924',
    classContractId: 'C000032424',
    regulatoryIdentityKey: 'sec:series-class:0000734383:S000002924:C000032424',
  },
  {
    category: 'international-etf',
    market: 'US',
    ticker: 'VEA',
    officialName: 'VANGUARD TAX-MANAGED FUNDS',
    registrantCik: '0000923202',
    seriesId: 'S000004386',
    classContractId: 'C000051262',
    regulatoryIdentityKey: 'sec:series-class:0000923202:S000004386:C000051262',
  },
] as const satisfies readonly OfficialEventAssetIdentityV1[]

function isValidIsin(value: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value)) return false

  const expanded = [...value]
    .map((character) =>
      /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character
    )
    .join('')
  let sum = 0
  let doubleDigit = false

  for (let index = expanded.length - 1; index >= 0; index -= 1) {
    let digit = Number(expanded[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }

  return sum % 10 === 0
}

function assertIdentityShape(identity: OfficialEventAssetIdentityV1): void {
  if (identity.ticker !== identity.ticker.toUpperCase()) {
    throw new Error('Official event ticker must be uppercase')
  }
  assertNonEmptyString(identity.officialName, 'officialName')
  assertNonEmptyString(identity.regulatoryIdentityKey, 'regulatoryIdentityKey')

  if (identity.category === 'international-etf') {
    if (!/^\d{10}$/.test(identity.registrantCik)) {
      throw new Error('registrantCik must contain exactly 10 digits')
    }
    if (!/^S\d{9}$/.test(identity.seriesId)) {
      throw new Error('seriesId has an invalid official format')
    }
    if (!/^C\d{9}$/.test(identity.classContractId)) {
      throw new Error('classContractId has an invalid official format')
    }
    return
  }

  if (!/^\d{14}$/.test(identity.cnpj)) {
    throw new Error('cnpj must contain exactly 14 digits')
  }
  if (
    identity.category === 'brazilian-stock' &&
    !/^\d{6}$/.test(identity.cvmCode)
  ) {
    throw new Error('cvmCode must preserve exactly 6 digits')
  }
  if (
    identity.category === 'real-estate-fund' &&
    identity.isin !== null &&
    !isValidIsin(identity.isin)
  ) {
    throw new Error('isin has an invalid official format or check digit')
  }
}

export function buildOfficialEventAssetIdentityKey(
  identity: OfficialEventAssetIdentityV1
): string {
  assertIdentityShape(identity)
  const strongIdentity =
    identity.category === 'brazilian-stock'
      ? `${identity.cnpj}|${identity.cvmCode}`
      : identity.category === 'real-estate-fund'
        ? `${identity.cnpj}|${identity.isin ?? ''}`
        : `${identity.registrantCik}|${identity.seriesId}|${identity.classContractId}`

  return [
    OFFICIAL_EVENT_ASSET_IDENTITIES_V1_VERSION,
    identity.category,
    identity.market,
    identity.ticker,
    strongIdentity,
  ]
    .map(encodeIdentityComponent)
    .join('|')
}

export function getOfficialEventAssetIdentitiesV1(): OfficialEventAssetIdentityV1[] {
  return ASSET_IDENTITIES.map(cloneAssetIdentity)
}

export function getOfficialEventAssetIdentityByTicker(
  ticker: string
): OfficialEventAssetIdentityV1 {
  if (ticker !== ticker.toUpperCase() || ticker.trim() !== ticker) {
    throw new Error('Official event ticker must be uppercase and unpadded')
  }
  const identity = ASSET_IDENTITIES.find(
    (candidate) => candidate.ticker === ticker
  )
  if (!identity) throw new Error(`Unsupported official event ticker: ${ticker}`)
  return cloneAssetIdentity(identity)
}

export function assertOfficialEventAssetIdentity(
  identity: OfficialEventAssetIdentityV1
): void {
  assertIdentityShape(identity)
  const canonical = getOfficialEventAssetIdentityByTicker(identity.ticker)
  if (
    buildOfficialEventAssetIdentityKey(identity) !==
      buildOfficialEventAssetIdentityKey(canonical) ||
    identity.officialName !== canonical.officialName ||
    identity.regulatoryIdentityKey !== canonical.regulatoryIdentityKey
  ) {
    throw new Error(`Official event identity diverges for ${identity.ticker}`)
  }
}

for (const identity of ASSET_IDENTITIES) {
  assertOfficialEventAssetIdentity(identity)
}
