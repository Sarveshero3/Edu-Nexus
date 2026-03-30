import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { applyTheme, useTheme } from '@/stores/themeStore'
import AuthGuard from '@/components/guards/AuthGuard'
import AppShell from '@/components/layout/AppShell'
import PublicLayout from '@/components/layout/PublicLayout'
import Home from '@/pages/Home'
import SignUp from '@/pages/SignUp'
import SignIn from '@/pages/SignIn'
import ForgotPassword from '@/pages/ForgotPassword'
import Docs from '@/pages/Docs'
import NotFound from '@/pages/NotFound'
import Onboarding from '@/pages/Onboarding'
import Sources from '@/pages/dashboard/Sources'
import Chat from '@/pages/dashboard/Chat'
import Graph from '@/pages/dashboard/Graph'
import History from '@/pages/dashboard/History'
import Viewer from '@/pages/dashboard/Viewer'
import Search from '@/pages/dashboard/Search'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes — shared Spline background via PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/docs" element={<Docs />} />

        {/* Protected: Onboarding */}
        <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />

        {/* Protected: Dashboard routes with AppShell */}
        <Route path="/dashboard/sources" element={<AuthGuard><AppShell><Sources /></AppShell></AuthGuard>} />
        <Route path="/dashboard/chat" element={<AuthGuard><AppShell><Chat /></AppShell></AuthGuard>} />
        <Route path="/dashboard/graph" element={<AuthGuard><AppShell><Graph /></AppShell></AuthGuard>} />
        <Route path="/dashboard/history" element={<AuthGuard><AppShell><History /></AppShell></AuthGuard>} />
        <Route path="/dashboard/viewer/:id" element={<AuthGuard><AppShell><Viewer /></AppShell></AuthGuard>} />
        <Route path="/dashboard/search" element={<AuthGuard><AppShell><Search /></AppShell></AuthGuard>} />

        {/* Protected: Profile & Settings with AppShell */}
        <Route path="/profile" element={<AuthGuard><AppShell><Profile /></AppShell></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><AppShell><Settings /></AppShell></AuthGuard>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}
