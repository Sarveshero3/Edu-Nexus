import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)

  if (!user || !token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
