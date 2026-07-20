import { OfficialEventsPageContent } from '../features/official-events/OfficialEventsPageContent'
import { useOfficialEventsUiDependenciesV1 } from '../features/official-events/officialEventsUiContext'

export function OfficialEventsPage() {
  const dependencies = useOfficialEventsUiDependenciesV1()
  return <OfficialEventsPageContent dependencies={dependencies} />
}
