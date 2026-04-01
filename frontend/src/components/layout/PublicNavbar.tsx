import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { cn } from '@/lib/utils'

/**
 * Minimal public navbar — logo + CTA only.
 * Nav links are placed below the hero fold on the Home page.
 */
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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6',
        scrolled
          ? 'py-3 backdrop-blur-xl border-b shadow-lg' 
          : 'py-5 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <Sparkles className="text-text-inverse" size={18} />
          </div>
          <span
            className="text-text-primary font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Edu Nexus
          </span>
        </Link>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => navigate('/dashboard/sources')}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-text-inverse text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all hover:scale-[1.03]"
            >
              Dashboard
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <button
                onClick={() => navigate('/sign-up')}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-text-inverse text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all hover:scale-[1.03]"
              >
                Get Started
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
