import { FundamentalsPageContent } from '../features/fundamentals/FundamentalsPageContent'
import { useFundamentalsUiDependenciesV1 } from '../features/fundamentals/fundamentalsUiContext'

export function FundamentalsPage() {
  const dependencies = useFundamentalsUiDependenciesV1()
  return <FundamentalsPageContent dependencies={dependencies} />
}
