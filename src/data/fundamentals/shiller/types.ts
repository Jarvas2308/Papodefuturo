export type ShillerCapeRow = {
  year: number
  month: number
  cape: number
}

export type ShillerCapeRawFieldProvenance = {
  sheetName: string
  column: string
  rawValue: number
}

export type ShillerCapeRecord = {
  series: 'shiller-cape-sp500'
  source: 'shiller-yale'
  referenceDate: string
  valueScaled: number
  valueScale: number
  provenance: {
    dataset: 'Shiller Online Data - U.S. Stock Markets 1871-Present'
    sheetName: string
    dateColumn: ShillerCapeRawFieldProvenance
    capeColumn: ShillerCapeRawFieldProvenance
  }
}

export type ShillerCapeFetcher = (
  url: string
) => Promise<Pick<Response, 'ok' | 'status' | 'arrayBuffer'>>
