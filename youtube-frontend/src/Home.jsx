// src/Home.jsx — with integrated Profile Edit Feature

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  useGetAllVideosQuery,
  useGetCurrentUserQuery,
} from './apiSlice'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Eye, Clock, Search as SearchIcon, TrendingUp, Play, X, LogIn, Heart,
  Pencil, Camera, Check, AlertCircle, Loader2, User, AtSign, Mail, Save,
  CheckCircle2, XCircle, Info,
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
    success: <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />,
    error:   <XCircle      size={18} className="text-red-400 flex-shrink-0" />,
    info:    <Info         size={18} className="text-blue-400 flex-shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error:   'border-red-500/30',
    info:    'border-blue-500/30',
  }

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-5 py-4 rounded-2xl
            bg-zinc-900/95 backdrop-blur-xl border ${borders[t.type]}
            shadow-2xl shadow-black/50 pointer-events-auto
            animate-[slideInRight_0.35s_cubic-bezier(0.34,1.56,0.64,1)]
            min-w-[260px] max-w-[340px]
          `}
        >
          {icons[t.type]}
          <span className="text-sm font-medium text-zinc-100 leading-snug">{t.message}</span>
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

  // Sync fields when user changes
  useEffect(() => {
    if (user) {
      setFullname(user.fullname || '')
      setUsername(user.username || '')
      setEmail(user.email    || '')
      setAvatarPreview(user.avatar || '/default-avatar.png')
    }
  }, [user])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return ()  => { document.body.style.overflow = '' }
  }, [open])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    toast.info('Avatar selected — save to apply')
  }

  const handleSave = async () => {
    if (!fullname.trim()) { toast.error('Full name cannot be empty'); return }
    if (!username.trim()) { toast.error('Username cannot be empty');  return }

    setSaving(true)
    try {
      // ── Avatar upload ──────────────────────────────────────────────────────
      if (avatarFile) {
        setAvatarUploading(true)
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        // Replace with your actual avatar-update endpoint
        const res = await fetch('/api/v1/users/avatar', {
          method: 'PATCH',
          body: formData,
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Avatar upload failed')
        setAvatarFile(null)
        setAvatarUploading(false)
      }

      // ── Profile fields ─────────────────────────────────────────────────────
      const res = await fetch('/api/v1/users/update-account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullname: fullname.trim(), email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.message || 'Update failed')
      }

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl shadow-black/60
                     pointer-events-auto animate-[modalIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Changes saved instantly</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/8 hover:bg-white/15 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Avatar section */}
          <div className="flex flex-col items-center pt-7 pb-4 px-7">
            <div className="relative group">
              {/* Glow ring animation */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-red-500/40 to-transparent
                              opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />

              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-red-500/40 transition-all duration-300">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Camera overlay */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1
                           opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Camera size={20} className="text-white" />
                <span className="text-[10px] font-bold text-white">CHANGE</span>
              </button>

              {/* Badge when new avatar selected */}
              {avatarFile && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-zinc-900">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Upload new photo
            </button>
            <p className="text-[11px] text-zinc-600 mt-1">JPG, PNG or GIF · Max 5 MB</p>
          </div>

          {/* Fields */}
          <div className="px-7 pb-7 space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <User size={12} /> Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/6 border border-white/10
                           focus:border-red-500/50 focus:bg-white/8 outline-none text-sm
                           placeholder-zinc-600 transition-all"
              />
            </div>

            {/* Username — read only hint */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <AtSign size={12} /> Username
                <span className="ml-auto text-[10px] text-zinc-600 font-normal">read-only</span>
              </label>
              <input
                type="text"
                value={username}
                readOnly
                className="w-full px-4 py-3.5 rounded-2xl bg-white/3 border border-white/6
                           outline-none text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/6 border border-white/10
                           focus:border-red-500/50 focus:bg-white/8 outline-none text-sm
                           placeholder-zinc-600 transition-all"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 mt-2
                         bg-red-600 hover:bg-red-500 disabled:bg-red-600/50
                         disabled:cursor-not-allowed rounded-2xl font-semibold text-sm
                         transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/20"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {avatarUploading ? 'Uploading avatar…' : 'Saving…'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video }) {
  const isRecent = new Date(video.createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)

  return (
    <Link to={`/watch/${video._id}`} className="group block">
      <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-2xl">
          {formatDuration(video.duration)}
        </div>
        {isRecent && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-3 h-6 rounded-2xl shadow-inner">
            <TrendingUp size={12} />
            TRENDING
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-2xl flex items-center justify-center ring-4 ring-white/30 scale-90 group-hover:scale-100 transition-transform">
            <Play size={28} fill="white" className="ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link
          to={`/channel/${video.owner?.username}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-red-500/40 transition-all">
            <img
              src={video.owner?.avatar || '/default-avatar.png'}
              alt={video.owner?.fullname || video.owner?.username}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
          <Link
            to={`/channel/${video.owner?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-sm text-zinc-400 hover:text-white mt-2 transition-colors"
          >
            {video.owner?.fullname || video.owner?.username}
          </Link>
          <div className="flex items-center text-xs text-zinc-500 mt-1 gap-2">
            <div className="flex items-center gap-1">
              <Eye size={13} />
              {formatViews(video.views)} views
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1">
              <Clock size={13} />
              {timeAgo(video.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-white/10 rounded-3xl mb-4 relative overflow-hidden">
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.8s_infinite]" />
      </div>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded-2xl w-4/5" />
          <div className="h-4 bg-white/10 rounded-2xl w-3/5" />
          <div className="h-3 bg-white/10 rounded-2xl w-2/5" />
        </div>
      </div>
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

  // Listen for openEditProfile events (from sidebar, nav, etc.)
  useEffect(() => {
    const handler = () => setEditOpen(true)
    window.addEventListener('openEditProfile', handler)
    return () => window.removeEventListener('openEditProfile', handler)
  }, [])

  // Debounce search
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WelcomePopup />
        <div className="mb-12 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-10 md:p-16 text-center">
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Welcome to the Family</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Hi, this is Faseeh Khan — welcome to our YouTube app! Join our growing community of creators,
            dreamers, and viewers. Watch, like, comment, upload, and manage everything from one dashboard.
            Sign in now and be part of something bigger 🚀
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 bg-white text-black hover:bg-white/90 transition-all duration-300
                       font-semibold text-lg px-10 py-4 rounded-3xl shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95"
          >
            <LogIn size={24} />
            Login to Join the Family
          </Link>
          <p className="text-zinc-500 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 underline">
              Create one — it's free
            </Link>
          </p>
        </div>
        <div className="text-center text-zinc-500 text-sm mt-8">
          faseeh khan . everything is possible when you have dreams
        </div>
      </div>
    )
  }

  // ── ERROR STATE ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="text-7xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold mb-3">Failed to load videos</h2>
        <p className="text-red-400 mb-6 max-w-md">
          {error?.data?.message || error?.error || 'Something went wrong while fetching videos.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3.5 bg-red-600 hover:bg-red-500 rounded-3xl font-semibold text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  const hasActiveFilter = searchTerm || activeCategory !== 'All'

  // ── AUTHENTICATED VIEW ─────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Global toast container */}
      <ToastContainer />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        user={currentUser}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refetchUser}
      />

      <WelcomePopup />

      {/* ── HERO SECTION ── */}
      <div className="relative mb-10">
        <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden">

          {/* Branding (left) */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative">
            <div className="w-72 h-72 bg-red-600/10 rounded-[4rem] rotate-12 flex items-center justify-center">
              <div className="text-[180px] opacity-10">🎥</div>
            </div>
            <div className="absolute text-white font-black text-6xl tracking-tighter -rotate-12 leading-none">
              FASEEH<span className="text-red-500">VISION</span>
            </div>
          </div>

          {/* Search + user profile (right) */}
          <div className="flex-1 w-full">
            {/* User profile row */}
            {currentUser && (
              <div className="flex items-center gap-3 mb-6">
                {/* Avatar with camera overlay on hover */}
                <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => setEditOpen(true)}>
                  {/* Glow pulse ring */}
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-red-500/50 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/15 group-hover:ring-red-500/50 transition-all duration-300">
                    <img
                      src={currentUser.avatar || '/default-avatar.png'}
                      alt={currentUser.fullname}
                      className="w-full h-full object-cover"
                    />
                    {/* Camera overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center
                                    opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Camera size={14} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight truncate">
                    {currentUser.fullname}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">@{currentUser.username}</p>
                </div>

                {/* Edit profile button */}
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30
                             rounded-2xl text-xs font-semibold text-zinc-300 hover:text-red-300 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <Pencil size={12} />
                  Edit Profile
                </button>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-center md:text-left mb-2">
              What are you watching today?
            </h1>
            <p className="text-zinc-400 text-center md:text-left mb-8 text-lg">
              Discover millions of videos from creators around the world
            </p>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto md:mx-0">
              <div className="flex items-center bg-white/10 border border-white/20 focus-within:border-red-500 rounded-3xl px-6 py-5 transition-all">
                <SearchIcon size={24} className="text-zinc-400" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search videos, creators, categories..."
                  className="flex-1 ml-4 bg-transparent outline-none text-lg placeholder-zinc-400"
                />
                {inputValue && (
                  <button
                    onClick={() => setInputValue('')}
                    className="text-xs px-4 py-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Hide scrollbar cross-browser via inline style */}
        <div
          className="flex gap-2 pb-1 overflow-x-auto flex-1 snap-x"
          style={{
            scrollbarWidth: 'none',       /* Firefox */
            msOverflowStyle: 'none',      /* IE / Edge */
          }}
          // Webkit scrollbar hidden via a tiny injected style below
        >
          {/* One-time style injection for webkit — won't cause re-renders */}
          <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`flex-shrink-0 snap-center px-7 py-3 rounded-3xl text-sm font-semibold transition-all whitespace-nowrap
                ${activeCategory === cat
                  ? 'bg-white text-black shadow-2xl shadow-red-500/30 scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 hover:border-white/30'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-3xl text-sm font-medium transition-colors flex-shrink-0"
          >
            <X size={16} />
            Clear filters
          </button>
        )}
      </div>

      {/* ── RESULTS INFO ── */}
      {hasActiveFilter && (
        <div className="flex items-baseline justify-between mb-6 px-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {searchTerm ? `Results for "${searchTerm}"` : activeCategory}
          </h2>
          <span className="text-zinc-400 text-sm font-medium">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── VIDEO GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
        {isLoading
          ? [...Array(12)].map((_, i) => <VideoSkeleton key={i} />)
          : filteredVideos.map((video) => <VideoCard key={video._id} video={video} />)
        }
      </div>

      {/* ── EMPTY STATE ── */}
      {!isLoading && filteredVideos.length === 0 && (
        <div className="py-28 text-center">
          <div className="text-8xl mb-6 opacity-40">🔎</div>
          <h3 className="text-2xl font-semibold mb-2">
            {searchTerm ? `No results for "${searchTerm}"` : 'No videos found'}
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            {searchTerm
              ? 'Try different keywords or remove some filters.'
              : "We couldn't find any videos matching this category right now."}
          </p>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-3xl text-sm font-medium"
            >
              Clear all filters and see everything
            </button>
          )}
        </div>
      )}

      {/* ── FETCHING INDICATOR ── */}
      {isFetching && !isLoading && (
        <div className="text-center py-8 text-zinc-400 text-sm flex items-center justify-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          Loading more videos...
        </div>
      )}

      <div className="text-center text-xs text-zinc-500 mt-16 opacity-70">
        FaseehVision . everything is possible when you have dreams
      </div>

      {/* ── Global animation keyframes ── */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%)  skewX(-12deg); }
        }
      `}</style>
    </div>
  )
}