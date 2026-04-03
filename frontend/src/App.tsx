import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { applyTheme, useTheme } from '@/stores/themeStore'
import AuthGuard from '@/components/guards/AuthGuard'
import AppShell from '@/components/layout/AppShell'

const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'))
const Home = lazy(() => import('@/pages/Home'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const SignIn = lazy(() => import('@/pages/SignIn'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const Docs = lazy(() => import('@/pages/Docs'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Sources = lazy(() => import('@/pages/dashboard/Sources'))
const Chat = lazy(() => import('@/pages/dashboard/Chat'))
const Graph = lazy(() => import('@/pages/dashboard/Graph'))
const History = lazy(() => import('@/pages/dashboard/History'))
const Viewer = lazy(() => import('@/pages/dashboard/Viewer'))
const Search = lazy(() => import('@/pages/dashboard/Search'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  const theme = useTheme((s) => s.theme)
  const accent = useTheme((s) => s.accentColor)

  useEffect(() => {
    applyTheme(theme, accent)
  }, [theme, accent])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route path="/docs" element={<Docs />} />

          <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />

          <Route path="/dashboard/sources" element={<AuthGuard><AppShell><Sources /></AppShell></AuthGuard>} />
          <Route path="/dashboard/chat" element={<AuthGuard><AppShell><Chat /></AppShell></AuthGuard>} />
          <Route path="/dashboard/graph" element={<AuthGuard><AppShell><Graph /></AppShell></AuthGuard>} />
          <Route path="/dashboard/history" element={<AuthGuard><AppShell><History /></AppShell></AuthGuard>} />
          <Route path="/dashboard/viewer/:id" element={<AuthGuard><AppShell><Viewer /></AppShell></AuthGuard>} />
          <Route path="/dashboard/search" element={<AuthGuard><AppShell><Search /></AppShell></AuthGuard>} />

          <Route path="/profile" element={<AuthGuard><AppShell><Profile /></AppShell></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><AppShell><Settings /></AppShell></AuthGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
