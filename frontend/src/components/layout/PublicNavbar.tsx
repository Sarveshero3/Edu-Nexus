import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import PillButton from '@/components/common/PillButton'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Dashboard', href: '/dashboard/sources' },
  { label: 'Docs', href: '/docs' },
]

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        scrolled ? 'glass-nav' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="text-accent-cyan" size={24} />
          <span className="text-white font-bold text-xl tracking-tight">Edu Nexus</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-text-muted hover:text-white transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          {user ? (
            <PillButton onClick={() => navigate('/dashboard/sources')}>
              Dashboard →
            </PillButton>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="text-text-muted hover:text-white transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <PillButton onClick={() => navigate('/sign-up')}>
                Get Started →
              </PillButton>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
