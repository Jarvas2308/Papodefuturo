import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { OfficialEventsUiProvider } from '../features/official-events/OfficialEventsUiProvider'
import { createRealOfficialEventsUiDependenciesV1 } from '../features/official-events/composition'
import { AppRouter } from './router/AppRouter'

export function AppComposition() {
  const [officialEventsDependencies] = useState(() =>
    createRealOfficialEventsUiDependenciesV1()
  )

  return (
    <AuthProvider>
      <OfficialEventsUiProvider dependencies={officialEventsDependencies}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </OfficialEventsUiProvider>
    </AuthProvider>
  )
}
