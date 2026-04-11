// src/Home.jsx — Premium Redesign (all logic preserved)

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  useGetAllVideosQuery,
  useGetCurrentUserQuery,
  useLogoutMutation,
} from './apiSlice'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Eye, Clock, Search as SearchIcon, TrendingUp, Play, X, LogIn, Heart,
  Pencil, Camera, Check, AlertCircle, Loader2, User, AtSign, Mail, Save,
  CheckCircle2, XCircle, Info, LogOut, ShieldAlert,
} from 'lucide-react'
import WelcomePopup from './Welcomepopup'

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All', 'Gaming', 'Music', 'Mixes', 'Live', 'Programming',
  'Podcasts', 'Education', 'Sports', 'News', 'Recently uploaded',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatViews = (views) => {
  if (!views && views !== 0) return '0'
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
  return views.toString()
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + 'm ago'
  return 'just now'
}

const formatDuration = (s) => {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Toast System ─────────────────────────────────────────────────────────────
let toastId = 0
const toastListeners = new Set()

export const toast = {
  success: (msg) => fireToast('success', msg),
  error:   (msg) => fireToast('error',   msg),
  info:    (msg) => fireToast('info',    msg),
}

function fireToast(type, message) {
  const id = ++toastId
  toastListeners.forEach((fn) => fn({ id, type, message }))
}

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3800)
    }
    toastListeners.add(handler)
    return () => toastListeners.delete(handler)
  }, [])

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
    error:   <XCircle      size={16} className="text-red-400 flex-shrink-0" />,
    info:    <Info         size={16} className="text-blue-400 flex-shrink-0" />,
  }

  const accents = {
    success: 'before:bg-emerald-500',
    error:   'before:bg-red-500',
    info:    'before:bg-blue-500',
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            relative flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-2xl
            bg-[#111]/95 backdrop-blur-2xl border border-white/[0.08]
            shadow-2xl shadow-black/60 pointer-events-auto overflow-hidden
            before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] ${accents[t.type]}
            animate-[toastIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]
            min-w-[240px] max-w-[320px]
          `}
        >
          {icons[t.type]}
          <span className="text-[13px] font-medium text-zinc-100 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Profile Edit Modal ───────────────────────────────────────────────────────
function ProfileEditModal({ user, open, onClose, onSaved }) {
  const [fullname, setFullname] = useState(user?.fullname || '')
  const [username, setUsername] = useState(user?.username || '')
  const [email,    setEmail]    = useState(user?.email    || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '/default-avatar.png')
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || '')
      setUsername(user.username || '')
      setEmail(user.email    || '')
      setAvatarPreview(user.avatar || '/default-avatar.png')
    }
  }, [user])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return ()  => { document.body.style.overflow = '' }
  }, [open])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    toast.info('Avatar selected — save to apply')
  }

  const handleSave = async () => {
    if (!fullname.trim()) { toast.error('Full name cannot be empty'); return }
    if (!username.trim()) { toast.error('Username cannot be empty');  return }
    setSaving(true)
    try {
      if (avatarFile) {
        setAvatarUploading(true)
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const res = await fetch('/api/v1/user/avatar', { method: 'PATCH', body: formData, credentials: 'include' })
        if (!res.ok) throw new Error('Avatar upload failed')
        setAvatarFile(null)
        setAvatarUploading(false)
      }
      const res = await fetch('/api/v1/user/update-account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullname: fullname.trim(), email: email.trim() }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data?.message || 'Update failed') }
      toast.success('Profile updated successfully! 🎉')
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
      setAvatarUploading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className="w-full sm:max-w-md bg-[#0f0f0f] border border-white/[0.08] sm:rounded-3xl rounded-t-3xl
                     shadow-2xl pointer-events-auto animate-[modalIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* drag handle for mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Edit Profile</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Changes saved instantly</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center pt-6 pb-3 px-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-red-500/40 transition-all duration-300">
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/55 flex flex-col items-center justify-center gap-1
                           opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Camera size={18} className="text-white" />
                <span className="text-[9px] font-bold text-white tracking-wider">CHANGE</span>
              </button>
              {avatarFile && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-[#0f0f0f]">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button onClick={() => fileRef.current?.click()} className="mt-2.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">
              Upload new photo
            </button>
            <p className="text-[11px] text-zinc-700 mt-0.5">JPG, PNG or GIF · Max 5 MB</p>
          </div>

          {/* Fields */}
          <div className="px-6 pb-6 space-y-3">
            {[
              { label: 'Full Name', icon: <User size={11} />, value: fullname, onChange: (e) => setFullname(e.target.value), placeholder: 'Your full name', readOnly: false, type: 'text' },
              { label: 'Username', icon: <AtSign size={11} />, value: username, onChange: null, placeholder: '', readOnly: true, type: 'text', badge: 'read-only' },
              { label: 'Email', icon: <Mail size={11} />, value: email, onChange: (e) => setEmail(e.target.value), placeholder: 'you@example.com', readOnly: false, type: 'email' },
            ].map(({ label, icon, value, onChange, placeholder, readOnly, type, badge }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5">
                  {icon} {label}
                  {badge && <span className="ml-auto text-[10px] text-zinc-700 font-normal">{badge}</span>}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  readOnly={readOnly}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all
                    ${readOnly
                      ? 'bg-white/[0.02] border border-white/[0.04] text-zinc-600 cursor-not-allowed'
                      : 'bg-white/[0.05] border border-white/[0.08] focus:border-red-500/40 focus:bg-white/[0.07] placeholder-zinc-700'
                    }`}
                />
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-1
                         bg-red-600 hover:bg-red-500 disabled:bg-red-600/40 disabled:cursor-not-allowed
                         rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" />{avatarUploading ? 'Uploading…' : 'Saving…'}</>
              ) : (
                <><Save size={15} />Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, trendingRank }) {
  const isRecent = new Date(video.createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)

  return (
    <Link
      to={`/watch/${video._id}`}
      className="group block w-full"
      onClick={(e) => {
        if (!navigator.onLine) {
          e.preventDefault()
          // show overlay by setting state on parent — use custom event
          window.dispatchEvent(new CustomEvent('offlineVideoClick'))
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-900 rounded-xl sm:rounded-2xl overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/95 text-white text-[11px] font-bold px-2 py-[2px] rounded-md tracking-wide">
          {formatDuration(video.duration)}
        </div>
        {/* Trending — only within 2 days */}
        {isRecent && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 h-5 rounded-md shadow-lg shadow-red-900/40">
            <TrendingUp size={9} strokeWidth={3} />
            NEW
          </div>
        )}
        {/* Hover play */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25 scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play size={20} fill="white" className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex gap-2.5 mt-2.5">
        <Link
          to={`/channel/${video.owner?.username}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 mt-0.5"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/[0.08] group-hover:ring-red-500/30 transition-all">
            <img src={video.owner?.avatar || '/default-avatar.png'} alt={video.owner?.fullname} className="w-full h-full object-cover" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[13px] sm:text-[14px] leading-snug line-clamp-2 text-zinc-100 group-hover:text-white transition-colors">
            {video.title}
          </h3>
          {/* ✅ Bright white creator name */}
          <Link
            to={`/channel/${video.owner?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[12px] text-zinc-200 hover:text-white mt-[3px] transition-colors truncate font-medium"
          >
            {video.owner?.fullname || video.owner?.username}
          </Link>
          {/* ✅ Bright views + time */}
          <div className="flex items-center gap-1 mt-[3px] flex-wrap">
            <Eye size={11} className="text-zinc-300 flex-shrink-0" />
            <span className="text-[11px] text-zinc-300 font-semibold">{formatViews(video.views)}</span>
            <span className="text-zinc-600 text-[10px]">views</span>
            <span className="text-zinc-700 text-[10px]">·</span>
            <span className="text-[11px] text-zinc-400">{timeAgo(video.createdAt)}</span>
          </div>
          {/* ✅ Smart tags — rank-based trending + new */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {trendingRank === 1 && (
              <span className="inline-flex items-center gap-0.5 bg-red-600 text-white text-[9px] font-bold px-2 h-4 rounded-md tracking-wide">
                🔥 #1 TRENDING
              </span>
            )}
            {trendingRank === 2 && (
              <span className="inline-flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-2 h-4 rounded-md tracking-wide">
                📈 #2 TRENDING
              </span>
            )}
            {trendingRank === 3 && (
              <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold px-2 h-4 rounded-md tracking-wide">
                ⚡ #3 TRENDING
              </span>
            )}
            {isRecent && (
              <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] font-bold px-2 h-4 rounded-md tracking-wide">
                ✦ NEW
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Shimmer Skeleton — matches YouTube single-column card ────────────────────
function VideoSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="relative w-full aspect-video bg-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden mb-2.5">
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_2s_infinite]" />
      </div>
      {/* Meta placeholder */}
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3 bg-white/[0.06] rounded-lg w-full" />
          <div className="h-3 bg-white/[0.06] rounded-lg w-4/5" />
          <div className="h-2.5 bg-white/[0.04] rounded-lg w-2/5 mt-1" />
        </div>
      </div>
    </div>
  )
}

// ─── Session Expired Screen ───────────────────────────────────────────────────
function SessionExpiredScreen() {
  const [signingOut, setSigningOut] = useState(false)
  const [logout] = useLogoutMutation()

  const handleSignOut = async () => {
    setSigningOut(true)
    try { await logout().unwrap() } catch (_) {}
    finally {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 animate-[modalIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <ShieldAlert size={36} className="text-red-400" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2 animate-[modalIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)]">
        Session Expired
      </h2>
      <p className="text-zinc-500 max-w-sm leading-relaxed mb-1 animate-[modalIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
        For your security, we've signed you out automatically. Please log in again to continue.
      </p>
      <p className="text-zinc-700 text-sm mb-10">Your watch history and preferences are saved ✓</p>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-2.5 px-8 py-3.5 bg-red-600 hover:bg-red-500
                   disabled:bg-red-600/50 disabled:cursor-not-allowed
                   rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
      >
        {signingOut ? <><Loader2 size={16} className="animate-spin" />Signing out…</> : <><LogOut size={16} />Sign Out &amp; Log In Again</>}
      </button>
      <p className="text-zinc-700 text-xs mt-5">FaseehVision · keeping your account safe 🔒</p>
    </div>
  )
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue,   setInputValue]   = useState(searchParams.get('search') || '')
  const [editOpen,     setEditOpen]      = useState(false)

  const searchTerm     = searchParams.get('search')   || ''
  const activeCategory = searchParams.get('category') || 'All'

  const { isAuthenticated } = useSelector((state) => state.auth)

  const { data: currentUserData, refetch: refetchUser } = useGetCurrentUserQuery(undefined, { skip: !isAuthenticated })
  const currentUser = currentUserData?.data

  const [showOfflineModal, setShowOfflineModal] = useState(false)

  useEffect(() => {
    const handler = () => setShowOfflineModal(true)
    window.addEventListener('offlineVideoClick', handler)
    return () => window.removeEventListener('offlineVideoClick', handler)
  }, [])

  useEffect(() => {
    const handler = () => setEditOpen(true)
    window.addEventListener('openEditProfile', handler)
    return () => window.removeEventListener('openEditProfile', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim() !== searchTerm) {
        const newParams = new URLSearchParams(searchParams)
        if (inputValue.trim()) newParams.set('search', inputValue.trim())
        else newParams.delete('search')
        setSearchParams(newParams, { replace: true })
      }
    }, 380)
    return () => clearTimeout(timer)
  }, [inputValue, searchTerm, searchParams, setSearchParams])

  const { data: videosData, isLoading, isFetching, isError, error } = useGetAllVideosQuery(
    isAuthenticated ? { page: 1, limit: 30, query: searchTerm } : undefined,
    { skip: !isAuthenticated }
  )

  const videos = videosData?.data || []

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'All') return videos
    const term = activeCategory.toLowerCase()
    return videos.filter((video) => {
      const title = (video.title || '').toLowerCase()
      const desc  = (video.description || '').toLowerCase()
      const owner = (video.owner?.fullname || video.owner?.username || '').toLowerCase()
      if (activeCategory === 'Recently uploaded') {
        return new Date(video.createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      }
      return title.includes(term) || desc.includes(term) || owner.includes(term)
    })
  }, [videos, activeCategory])

  const handleCategoryClick = (cat) => {
    const newParams = new URLSearchParams(searchParams)
    if (cat === 'All') newParams.delete('category')
    else newParams.set('category', cat)
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setInputValue('')
    setSearchParams({})
  }

  // ── NOT LOGGED IN ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <WelcomePopup />

        <div className="relative mb-10 rounded-3xl overflow-hidden border border-white/[0.07] bg-[#0a0a0a]">
          {/* subtle noise texture via pseudo-element workaround */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_left,#ff0000_0%,transparent_60%)]" />
          <div className="relative z-10 p-8 md:p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/10">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Welcome to the Family
            </h2>
            <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-8">
              Hi, this is Faseeh Khan — welcome to our YouTube app! Join our growing community of creators,
              dreamers, and viewers. Watch, like, comment, upload, and manage everything from one dashboard.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white
                         font-semibold text-base px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <LogIn size={18} />
              Login to Join
            </Link>
            <p className="text-zinc-600 mt-5 text-sm">
              No account?{' '}
              <Link to="/register" className="text-red-400 hover:text-red-300 underline">
                Create one free
              </Link>
            </p>
          </div>
        </div>
        <div className="text-center text-zinc-700 text-xs">
          faseeh khan · everything is possible when you have dreams
        </div>
      </div>
    )
  }

  // ── ERROR STATE ────────────────────────────────────────────────────────────
  const isTokenError =
    error?.status === 401 ||
    error?.data?.message?.toLowerCase().includes('token') ||
    error?.data?.message?.toLowerCase().includes('unauthorized') ||
    error?.error?.toLowerCase?.()?.includes('token')

  if (isError) {
    if (isTokenError) return <SessionExpiredScreen />

    const isOffline = !navigator.onLine

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 border
          ${isOffline ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <span className="text-4xl">{isOffline ? '📡' : '⚠️'}</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">
          {isOffline ? 'You\'re offline' : 'Failed to load videos'}
        </h2>
        <p className="text-zinc-500 max-w-sm leading-relaxed mb-1 text-sm">
          {isOffline
            ? 'Connect to the internet to browse and watch videos on FaseehVision.'
            : error?.data?.message || 'Something went wrong while fetching videos.'}
        </p>
        {isOffline && (
          <p className="text-zinc-700 text-xs mb-8">Your app is loaded from cache ✓</p>
        )}
        <button
          onClick={() => window.location.reload()}
          className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 mt-4
            ${isOffline ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {isOffline ? '🔄 Try Again' : 'Retry'}
        </button>
      </div>
    )
  }

  const hasActiveFilter = searchTerm || activeCategory !== 'All'

  // ── AUTHENTICATED VIEW ─────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <ToastContainer />

      {/* ── OFFLINE VIDEO MODAL ── */}
      {showOfflineModal && (
        <>
          <div
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md"
            onClick={() => setShowOfflineModal(false)}
          />
          <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-sm bg-[#0f0f0f] border border-white/[0.08]
                            rounded-3xl p-8 text-center animate-[modalIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15
                              flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">📡</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">No Internet Connection</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Connect to the internet to play videos. FaseehVision streams all videos live from the cloud.
              </p>
              <button
                onClick={() => {
                  setShowOfflineModal(false)
                  window.location.reload()
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mb-2"
              >
                🔄 Retry Connection
              </button>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl text-sm text-zinc-400 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </>
      )}

      <ProfileEditModal
        user={currentUser}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refetchUser}
      />

      <WelcomePopup />

      {/* ── HERO ── */}
      <div className="relative mb-6 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0c0c0c]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,#ff000015_0%,transparent_100%)]" />

        <div className="relative z-10 p-4 sm:p-8 md:p-10">

          {/* User profile row */}
          {currentUser && (
            <div className="flex items-center gap-3 mb-5">
              <div
                className="relative group flex-shrink-0 cursor-pointer"
                onClick={() => setEditOpen(true)}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-1 ring-white/10 group-hover:ring-red-500/40 transition-all duration-300">
                  <img src={currentUser.avatar || '/default-avatar.png'} alt={currentUser.fullname} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full">
                    <Camera size={12} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">{currentUser.fullname}</p>
                <p className="text-xs text-zinc-600 truncate">@{currentUser.username}</p>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.09]
                           border border-white/[0.08] rounded-xl text-xs font-medium text-zinc-400
                           hover:text-zinc-200 transition-all flex-shrink-0"
              >
                <Pencil size={11} />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none mb-1">
              What are you watching
              <span className="text-red-500"> today?</span>
            </h1>
            <p className="text-zinc-600 text-sm hidden sm:block">
              Discover videos from creators around the world
            </p>
          </div>

          {/* Search bar — mobile optimized */}
          <div className="relative w-full max-w-2xl">
            <div className={`flex items-center bg-white/[0.06] border rounded-xl sm:rounded-2xl px-3.5 sm:px-5 py-3 sm:py-4 transition-all gap-2
              ${inputValue ? 'border-red-500/40' : 'border-white/[0.08] focus-within:border-white/20'}`}>
              <SearchIcon size={18} className="text-zinc-500 flex-shrink-0" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search videos, creators..."
                className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder-zinc-600 min-w-0"
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={12} className="text-zinc-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="flex gap-1.5 pb-1 overflow-x-auto flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap
                ${activeCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-red-500/10
                       text-zinc-500 hover:text-red-400 rounded-xl text-xs font-medium transition-colors flex-shrink-0 border border-white/[0.06]"
          >
            <X size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* ── RESULTS INFO ── */}
      {hasActiveFilter && (
        <div className="flex items-baseline justify-between mb-5 px-0.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {searchTerm ? `"${searchTerm}"` : activeCategory}
          </h2>
          <span className="text-zinc-600 text-xs font-medium">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── VIDEO GRID — YouTube style ── */}
      {(() => {
        // Compute top 3 video IDs by views dynamically
        const top3 = [...filteredVideos]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3)
          .map((v) => v._id)

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 sm:gap-x-5 gap-y-6 sm:gap-y-8">
            {isLoading
              ? [...Array(12)].map((_, i) => <VideoSkeleton key={i} />)
              : filteredVideos.map((video) => (
                  <VideoCard
                    key={video._id}
                    video={video}
                    trendingRank={top3.indexOf(video._id) !== -1 ? top3.indexOf(video._id) + 1 : null}
                  />
                ))
            }
          </div>
        )
      })()}

      {/* ── EMPTY STATE ── */}
      {!isLoading && filteredVideos.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-6xl mb-4 opacity-30">🔎</div>
          <h3 className="text-xl font-bold mb-2">
            {searchTerm ? `No results for "${searchTerm}"` : 'No videos found'}
          </h3>
          <p className="text-zinc-600 max-w-sm mx-auto text-sm">
            {searchTerm ? 'Try different keywords.' : "No videos in this category yet."}
          </p>
          {hasActiveFilter && (
            <button onClick={clearFilters}
              className="mt-6 px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-sm font-medium transition-colors">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── FETCHING INDICATOR ── */}
      {isFetching && !isLoading && (
        <div className="text-center py-6 text-zinc-600 text-xs flex items-center justify-center gap-2">
          <span className="animate-spin w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full" />
          Loading…
        </div>
      )}

      <div className="text-center text-[14px] text-white mt-14">
        FaseehVision · everything is possible when you have dreams
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}