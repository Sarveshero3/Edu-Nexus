import { useState } from 'react'
import { useAuth } from '@/stores/authStore'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'

export default function Profile() {
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const [name, setName] = useState(user?.name || '')
  const [institution, setInstitution] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [role, setRole] = useState('Student')
  const [showDelete, setShowDelete] = useState(false)

  const handleSave = () => {
    if (user) setUser({ ...user, name, institution, fieldOfStudy, role: role as any })
  }

  return (
    <PageTransition className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Your Profile</h1>

      <GlassCard hover={false} className="p-6 flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{user?.name}</p>
          <p className="text-text-muted text-sm">{user?.email}</p>
          <p className="text-text-muted text-xs mt-1">Member since March 2026</p>
          <button className="text-accent-cyan text-xs mt-2 hover:underline">Change photo</button>
        </div>
      </GlassCard>

      <h2 className="text-white font-semibold text-sm mb-4">Personal Information</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-text-muted text-xs block mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="text-text-muted text-xs block mb-1.5">Display Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" />
        </div>
      </div>

      <h2 className="text-white font-semibold text-sm mb-4">Academic Information</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-text-muted text-xs block mb-1.5">Institution</label>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="text-text-muted text-xs block mb-1.5">Field of Study</label>
          <input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="text-text-muted text-xs block mb-1.5">Academic Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field text-sm">
            <option>Student</option><option>Researcher</option><option>Faculty</option><option>Other</option>
          </select>
        </div>
      </div>

      <div className="border border-red-500/30 rounded-[16px] p-6 mb-8">
        <h2 className="text-red-400 font-semibold text-sm mb-2">Danger Zone</h2>
        <p className="text-text-muted text-xs mb-4">Once deleted, your account cannot be recovered.</p>
        {!showDelete ? (
          <PillButton variant="danger" onClick={() => setShowDelete(true)}>Delete Account</PillButton>
        ) : (
          <div className="flex gap-3">
            <PillButton variant="danger">Confirm Delete</PillButton>
            <PillButton variant="ghost" onClick={() => setShowDelete(false)}>Cancel</PillButton>
          </div>
        )}
      </div>

      <PillButton onClick={handleSave}>Save Changes</PillButton>
    </PageTransition>
  )
}
