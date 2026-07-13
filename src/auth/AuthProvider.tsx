import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AuthContext,
  type AuthStatus,
  type SignUpResult,
} from './authContext'
import { createSupabaseBrowserClient } from '../lib/supabaseClient'
import { readCurrentViteSupabaseEnvironment } from '../lib/viteEnv'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const client = useMemo(
    () =>
      createSupabaseBrowserClient(readCurrentViteSupabaseEnvironment()),
    []
  )
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    client ? 'loading' : 'demo'
  )

  useEffect(() => {
    if (!client) {
      return
    }

    let isActive = true

    void client.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return
      }

      if (error) {
        setSession(null)
        setStatus('unauthenticated')
        return
      }

      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) {
        return
      }

      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [client])

  async function signIn(email: string, password: string): Promise<void> {
    if (!client) {
      throw new Error('Supabase Auth is not configured')
    }

    const { error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      throw error
    }
  }

  async function signUp(
    email: string,
    password: string
  ): Promise<SignUpResult> {
    if (!client) {
      throw new Error('Supabase Auth is not configured')
    }

    const { data, error } = await client.auth.signUp({ email, password })

    if (error) {
      throw error
    }

    return {
      requiresEmailConfirmation: data.session === null,
    }
  }

  async function signOut(): Promise<void> {
    if (!client) {
      return
    }

    const { error } = await client.auth.signOut()

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        user: session?.user ?? null,
        client,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
