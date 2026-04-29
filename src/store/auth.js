import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setGeladen(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, geladen }
}

export async function stuurInlogCode(email) {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw error
}

export async function verifieerInlogCode(email, code) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}
