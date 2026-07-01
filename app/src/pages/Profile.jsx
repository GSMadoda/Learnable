import { useState } from 'react'
import { api } from '../api.js'
import { useAuth, useUI } from '../state.jsx'
import { Button, Field, Input } from '../ui.jsx'

// Edit profile — the fields the alumni directory surfaces (PUT /api/profile).
export default function Profile() {
  const { user, setUser } = useAuth()
  const { toast } = useUI()

  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [headline, setHeadline] = useState(user?.headline || '')
  const [education, setEducation] = useState(user?.education || '')
  const [linkedin, setLinkedin] = useState(user?.linkedin || '')
  const [alumniVisible, setAlumniVisible] = useState(user?.alumniVisible ?? true)
  const [busy, setBusy] = useState(false)

  function onPickAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 250000) {
      toast('That image is too large — please use a photo under ~250KB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  async function onSave(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const { user } = await api.updateProfile({
        name,
        avatar,
        headline,
        education,
        linkedin,
        alumniVisible,
      })
      setUser(user)
      toast('Profile saved.', 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <header className="mb-6">
        <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-blue">
          Your profile
        </p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink-navy sm:text-[34px]">
          Profile
        </h1>
      </header>

      <form
        onSubmit={onSave}
        className="flex flex-col gap-5 rounded-panel border border-line bg-white p-6 shadow-card sm:p-8"
      >
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 font-display text-xl font-bold text-blue">
              {name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex cursor-pointer items-center rounded-btn border border-line bg-white px-4 py-2 text-[14px] font-semibold text-ink-navy transition-colors hover:bg-blue-50">
              Change photo
              <input type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
            </label>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="text-left text-[13px] text-slate-400 hover:text-ink-navy"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input value={user?.email || ''} disabled className="bg-slate-50 text-slate-400" />
        </Field>
        <Field label="Headline" hint="Shown on the alumni directory.">
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Aspiring ML engineer"
          />
        </Field>
        <Field label="Education">
          <Input
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. BSc Computer Science"
          />
        </Field>
        <Field label="LinkedIn URL" hint="Must be a full URL (https://…).">
          <Input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/you"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-control border border-line bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={alumniVisible}
            onChange={(e) => setAlumniVisible(e.target.checked)}
            className="h-4 w-4 accent-blue"
          />
          <span className="text-[14px] text-slate-700">
            Show me in the alumni directory once I earn a credential
          </span>
        </label>

        <div>
          <Button type="submit" size="lg" loading={busy}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  )
}
