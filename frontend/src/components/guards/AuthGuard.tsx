import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  const checkAuth = useAuth((s) => s.checkAuth)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Validate session against backend on mount
    checkAuth().finally(() => setChecked(true))
  }, [checkAuth])

  // Show nothing while verifying
  if (!checked) return null

  if (!user || !token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
