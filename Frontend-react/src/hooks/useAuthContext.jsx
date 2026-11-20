import { createContext, useContext } from 'react'
import useAuthHook from './useAuth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const auth = useAuthHook()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
