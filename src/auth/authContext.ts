import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { SupabaseBrowserClient } from '../lib/supabaseClient'

export type AuthStatus =
  'loading' | 'authenticated' | 'unauthenticated' | 'demo'

export type SignUpResult = {
  requiresEmailConfirmation: boolean
}

export type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  client: SupabaseBrowserClient | null
  isPasswordRecovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
