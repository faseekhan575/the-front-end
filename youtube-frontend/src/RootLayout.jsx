// src/RootLayout.jsx — Premium Redesign + Integrated Edit Profile

import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import InstallBanner from './InstallBanner'
import NotificationBell from './NotificationBell'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import {
  useGetCurrentUserQuery,
  useGetChannelProfileQuery,
  useGetChannelStatsQuery,
  useUpdateAvatarMutation,
  useUpdateCoverImageMutation,
  useUpdateAccountMutation,
  useChangePasswordMutation,
} from './apiSlice'
import { setUser, logout } from './authSlice'
import {
  Menu, Search, Upload, Bell, Home, PlayCircle,
  Library, History, ThumbsUp, Users, LayoutDashboard,
  LogOut, ChevronDown, Flame, TrendingUp, Tv2,
  Mic2, Gamepad2, BookOpen, Zap, Pencil, Camera,
  CheckCircle, AlertCircle, X, Loader2, Mail, AtSign,
  Shield, ImageIcon, KeyRound, User as UserIcon,
} from 'lucide-react'
import { Toaster } from 'sonner'
import WelcomePopup from './Welcomepopup'

// ─── FaseehVision F Logo — pixel-perfect geometric SVG ───────────────────────
// Matches the uploaded logo: black bg, bold white angular F with diagonal cuts
function FLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 90 105"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      className={className}
    >
      {/*
        Outer path traces the full F shape:
        - Left vertical bar (x 0–18, full height 0–105)
        - Top arm: spans full width to x=82, then diagonal cut down to x=60,y=22
        - Returns along inner top edge to x=18, drops to middle arm level y=40
        - Middle arm: goes to x=58, diagonal cut to x=36,y=62
        - Returns to vertical bar, goes to bottom
      */}
      <path d="M 0,0 L 82,0 L 60,22 L 18,22 L 18,40 L 58,40 L 36,62 L 18,62 L 18,105 L 0,105 Z" />
    </svg>
  )
}

// ─── Nav Items with individual bright colors ──────────────────────────────────
const NAV_ITEMS = [
  {
    icon: Home,
    label: 'Home',
    path: '/',
    color: 'text-sky-400',
    activeBg: 'bg-sky-500/15',
    activeBar: 'bg-sky-400',
    activeDot: 'bg-sky-400',
    hoverColor: 'hover:text-sky-300',
    glow: 'drop-shadow-[0_0_7px_rgba(56,189,248,0.85)]',
  },
  {
    icon: Users,
    label: 'Subscriptions',
    path: '/subscriptions',
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/15',
    activeBar: 'bg-violet-400',
    activeDot: 'bg-violet-400',
    hoverColor: 'hover:text-violet-300',
    glow: 'drop-shadow-[0_0_7px_rgba(167,139,250,0.85)]',
  },
  {
    icon: ThumbsUp,
    label: 'Liked Videos',
    path: '/liked',
    color: 'text-pink-400',
    activeBg: 'bg-pink-500/15',
    activeBar: 'bg-pink-400',
    activeDot: 'bg-pink-400',
    hoverColor: 'hover:text-pink-300',
    glow: 'drop-shadow-[0_0_7px_rgba(244,114,182,0.85)]',
  },
  {
    icon: History,
    label: 'History',
    path: '/history',
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/15',
    activeBar: 'bg-amber-400',
    activeDot: 'bg-amber-400',
    hoverColor: 'hover:text-amber-300',
    glow: 'drop-shadow-[0_0_7px_rgba(251,191,36,0.85)]',
  },
  {
    icon: Library,
    label: 'Playlists',
    path: '/playlists',
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/15',
    activeBar: 'bg-emerald-400',
    activeDot: 'bg-emerald-400',
    hoverColor: 'hover:text-emerald-300',
    glow: 'drop-shadow-[0_0_7px_rgba(52,211,153,0.85)]',
  },
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/15',
    activeBar: 'bg-orange-400',
    activeDot: 'bg-orange-400',
    hoverColor: 'hover:text-orange-300',
    glow: 'drop-shadow-[0_0_7px_rgba(251,146,60,0.85)]',
  },
]

const CATEGORIES = [
  { icon: Flame,      label: 'Trending'  },
  { icon: TrendingUp, label: 'New'       },
  { icon: Gamepad2,   label: 'Gaming'    },
  { icon: Mic2,       label: 'Music'     },
  { icon: Tv2,        label: 'Live'      },
  { icon: BookOpen,   label: 'Education' },
  { icon: Zap,        label: 'Shorts'    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

// ─── Status Toast ─────────────────────────────────────────────────────────────
function StatusToast({ status, onClose }) {
  if (!status) return null
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium mb-5
      ${status.type === 'success'
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
        : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}
    >
      {status.type === 'success'
        ? <CheckCircle size={15} className="flex-shrink-0" />
        : <AlertCircle size={15} className="flex-shrink-0" />}
      <span className="flex-1 leading-snug">{status.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ isOpen, onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('info')

  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [fullname,  setFullname]  = useState('')

  const [oldPassword,     setOldPassword]     = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords,   setShowPasswords]   = useState(false)

  const [avatarFile,    setAvatarFile]    = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile,     setCoverFile]     = useState(null)
  const [coverPreview,  setCoverPreview]  = useState(null)

  const avatarInputRef = useRef(null)
  const coverInputRef  = useRef(null)
  const [status, setStatus] = useState(null)

  const [updateAccount,    { isLoading: updatingAccount  }] = useUpdateAccountMutation()
  const [changePassword,   { isLoading: changingPassword }] = useChangePasswordMutation()
  const [updateAvatar,     { isLoading: updatingAvatar   }] = useUpdateAvatarMutation()
  const [updateCoverImage, { isLoading: updatingCover    }] = useUpdateCoverImageMutation()

  const busy = updatingAccount || changingPassword || updatingAvatar || updatingCover

  useEffect(() => {
    if (currentUser && isOpen) {
      setUsername(currentUser.username || '')
      setEmail(currentUser.email || '')
      setFullname(currentUser.fullname || '')
      setActiveTab('info')
      setStatus(null)
      setAvatarFile(null); setAvatarPreview(null)
      setCoverFile(null);  setCoverPreview(null)
      setOldPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }, [currentUser, isOpen])

  if (!isOpen) return null

  const readFile = (file, type) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (type === 'avatar') { setAvatarFile(file); setAvatarPreview(ev.target.result) }
      else                   { setCoverFile(file);  setCoverPreview(ev.target.result)  }
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateInfo = async () => {
    if (!username && !email && !fullname) {
      setStatus({ type: 'error', message: 'Fill at least one field to update.' }); return
    }
    try {
      await updateAccount({ username, email, fullname }).unwrap()
      setStatus({ type: 'success', message: 'Profile updated! ✨' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.data?.message || 'Failed to update profile.' })
    }
  }

  const handleUpdateAvatar = async () => {
    if (!avatarFile) { setStatus({ type: 'error', message: 'Select an avatar first.' }); return }
    const fd = new FormData(); fd.append('avatar', avatarFile)
    try {
      await updateAvatar(fd).unwrap()
      setStatus({ type: 'success', message: 'Avatar updated! 🎉' })
      setAvatarFile(null)
    } catch (err) {
      setStatus({ type: 'error', message: err?.data?.message || 'Upload failed.' })
    }
  }

  const handleUpdateCover = async () => {
    if (!coverFile) { setStatus({ type: 'error', message: 'Select a cover image first.' }); return }
    const fd = new FormData(); fd.append('coverImage', coverFile)
    try {
      await updateCoverImage(fd).unwrap()
      setStatus({ type: 'success', message: 'Cover updated! 🎨' })
      setCoverFile(null)
    } catch (err) {
      setStatus({ type: 'error', message: err?.data?.message || 'Upload failed.' })
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'Fill all password fields.' }); return
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: "Passwords don't match." }); return
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Min. 6 characters required.' }); return
    }
    try {
      await changePassword({
        oldapassward: oldPassword, newpassward: newPassword, conform_passward: confirmPassword,
      }).unwrap()
      setStatus({ type: 'success', message: 'Password changed! 🔐' })
      setOldPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      setStatus({ type: 'error', message: err?.data?.message || 'Failed to change password.' })
    }
  }

  const TABS = [
    { id: 'info',     label: 'Personal Info', icon: UserIcon  },
    { id: 'avatar',   label: 'Avatar',        icon: Camera    },
    { id: 'cover',    label: 'Cover Image',   icon: ImageIcon },
    { id: 'password', label: 'Password',      icon: Shield    },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,.95)] flex flex-col max-h-[92vh]">

        <div className="h-28 relative overflow-hidden flex-shrink-0 bg-gradient-to-br from-zinc-900 to-zinc-950">
          <img src={coverPreview || currentUser?.coverImages || ''} alt="cover"
            className="w-full h-full object-cover opacity-70"
            onError={(e) => { e.target.style.display = 'none' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#0f0f0f]" />
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-red-600/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-4 left-12 w-20 h-20 bg-red-500/15 rounded-full blur-2xl" />
        </div>

        <div className="px-7 -mt-11 flex items-end justify-between relative z-10 flex-shrink-0">
          <div className="relative group">
            <div
              className="w-[4.5rem] h-[4.5rem] rounded-[1.25rem] overflow-hidden ring-4 ring-[#0f0f0f] shadow-2xl cursor-pointer"
              onClick={() => { setActiveTab('avatar'); setTimeout(() => avatarInputRef.current?.click(), 80) }}
            >
              <img src={avatarPreview || currentUser?.avatar || '/default-avatar.png'} alt="avatar"
                className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-70 group-hover:scale-110" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none rounded-[1.25rem]">
              <Camera size={20} className="text-white drop-shadow-lg" />
            </div>
            <button
              onClick={() => { setActiveTab('avatar'); setTimeout(() => avatarInputRef.current?.click(), 80) }}
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <Pencil size={11} />
            </button>
          </div>
          <button onClick={onClose} className="mb-1.5 p-2 bg-white/8 hover:bg-white/15 border border-white/10 rounded-2xl transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="px-7 pt-3.5 pb-0 flex-shrink-0">
          <h2 className="text-[1.35rem] font-bold tracking-tight">Edit Profile</h2>
          <p className="text-zinc-500 text-sm mt-0.5">@{currentUser?.username}</p>
        </div>

        <div className="flex mt-5 px-7 border-b border-white/8 flex-shrink-0 overflow-x-auto scrollbar-hide gap-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveTab(id); setStatus(null) }}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider rounded-t-xl whitespace-nowrap flex-shrink-0 transition-all
                ${activeTab === id
                  ? 'text-white border-b-2 border-red-500 bg-white/5 -mb-px'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/4'}`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="px-7 py-6 overflow-y-auto flex-1 scrollbar-hide">
          <StatusToast status={status} onClose={() => setStatus(null)} />

          {activeTab === 'info' && (
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: fullname, setter: setFullname, icon: UserIcon, placeholder: 'Your full name',  type: 'text'  },
                { label: 'Username',  value: username, setter: setUsername, icon: AtSign,   placeholder: 'your_username',  type: 'text'  },
                { label: 'Email',     value: email,    setter: setEmail,    icon: Mail,     placeholder: 'your@email.com', type: 'email' },
              ].map(({ label, value, setter, icon: Icon, placeholder, type }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">{label}</label>
                  <div className="flex items-center bg-white/4 border border-white/8 focus-within:border-red-500/50 focus-within:bg-white/6 rounded-2xl px-4 py-3.5 gap-3 transition-all">
                    <Icon size={14} className="text-zinc-600 flex-shrink-0" />
                    <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                      className="flex-1 bg-transparent outline-none text-sm placeholder-zinc-700 text-white" />
                  </div>
                </div>
              ))}
              <button onClick={handleUpdateInfo} disabled={busy}
                className="w-full py-3.5 mt-1 bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                {updatingAccount ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <><CheckCircle size={15} />Save Changes</>}
              </button>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-36 h-36 rounded-[2rem] overflow-hidden ring-4 ring-white/8 shadow-2xl">
                    <img src={avatarPreview || currentUser?.avatar || '/default-avatar.png'} alt="preview"
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-60" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <div className="bg-black/50 backdrop-blur-md rounded-[1.5rem] p-3.5"><Camera size={26} className="text-white" /></div>
                  </div>
                </div>
                <input type="file" accept="image/*" ref={avatarInputRef}
                  onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0], 'avatar') }} className="hidden" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-300">Upload a new profile picture</p>
                  <p className="text-xs text-zinc-600 mt-1">JPG, PNG, GIF — max 10 MB</p>
                </div>
                <button onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/20 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                  <Upload size={15} />Choose Image
                </button>
              </div>
              {avatarFile && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 flex-1 truncate">{avatarFile.name}</span>
                  <button onClick={() => { setAvatarFile(null); setAvatarPreview(null) }} className="text-zinc-600 hover:text-white"><X size={14} /></button>
                </div>
              )}
              <button onClick={handleUpdateAvatar} disabled={!avatarFile || busy}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                {updatingAvatar ? <><Loader2 size={15} className="animate-spin" />Uploading…</> : <><Upload size={15} />Upload Avatar</>}
              </button>
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="space-y-5">
              <div onClick={() => coverInputRef.current?.click()}
                className="relative w-full h-44 bg-white/4 border-2 border-dashed border-white/10 hover:border-red-500/40 rounded-3xl overflow-hidden cursor-pointer transition-all group">
                {(coverPreview || currentUser?.coverImages) && (
                  <img src={coverPreview || currentUser?.coverImages} alt="Cover preview"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-50 group-hover:scale-105" />
                )}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-300
                  ${(coverPreview || currentUser?.coverImages) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                  <div className="p-4 bg-white/8 backdrop-blur-sm rounded-2xl"><ImageIcon size={28} className="text-zinc-400" /></div>
                  <p className="text-sm font-semibold text-zinc-300">Click to upload cover image</p>
                  <p className="text-xs text-zinc-600">Recommended: 1280 × 360 px</p>
                </div>
              </div>
              <input type="file" accept="image/*" ref={coverInputRef}
                onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0], 'cover') }} className="hidden" />
              {coverFile && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 flex-1 truncate">{coverFile.name}</span>
                  <button onClick={() => { setCoverFile(null); setCoverPreview(null) }} className="text-zinc-600 hover:text-white"><X size={14} /></button>
                </div>
              )}
              <button onClick={handleUpdateCover} disabled={!coverFile || busy}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                {updatingCover ? <><Loader2 size={15} className="animate-spin" />Uploading…</> : <><Upload size={15} />Upload Cover</>}
              </button>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-4">
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-start gap-3">
                <Shield size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300/75 leading-relaxed">You need your current password to set a new one. Minimum 6 characters.</p>
              </div>
              {[
                { label: 'Current Password',    value: oldPassword,     setter: setOldPassword,     ph: 'Enter current password' },
                { label: 'New Password',         value: newPassword,     setter: setNewPassword,     ph: 'Min. 6 characters'       },
                { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, ph: 'Re-enter new password'   },
              ].map(({ label, value, setter, ph }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">{label}</label>
                  <div className="flex items-center bg-white/4 border border-white/8 focus-within:border-red-500/50 rounded-2xl px-4 py-3.5 gap-3 transition-all">
                    <KeyRound size={14} className="text-zinc-600 flex-shrink-0" />
                    <input type={showPasswords ? 'text' : 'password'} value={value}
                      onChange={(e) => setter(e.target.value)} placeholder={ph}
                      className="flex-1 bg-transparent outline-none text-sm placeholder-zinc-700 text-white" />
                  </div>
                </div>
              ))}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setShowPasswords(!showPasswords)}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${showPasswords ? 'bg-red-600' : 'bg-white/15'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${showPasswords ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm text-zinc-500">Show passwords</span>
              </label>
              <button onClick={handleChangePassword} disabled={busy}
                className="w-full py-3.5 mt-1 bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                {changingPassword ? <><Loader2 size={15} className="animate-spin" />Changing…</> : <><Shield size={15} />Change Password</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [searchQuery,      setSearchQuery]      = useState('')
  const [searchFocused,    setSearchFocused]    = useState(false)
  const [profileOpen,      setProfileOpen]      = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const profileRef = useRef(null)

  const navigate  = useNavigate()
  const location  = useLocation()
  const dispatch  = useDispatch()

  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const { data: currentUserData } = useGetCurrentUserQuery(undefined, { skip: !isAuthenticated })
  const currentUser = currentUserData?.data || user

  const { data: channelData } = useGetChannelProfileQuery(user?.username, {
    skip: !user?.username || !isAuthenticated,
  })
  const chanStats = channelData?.data

  const { data: dashData } = useGetChannelStatsQuery(undefined, { skip: !isAuthenticated })
  const dashStats = dashData?.data?.[0] || dashData?.data || {}

  useEffect(() => {
    if (currentUserData?.data) dispatch(setUser(currentUserData.data))
  }, [currentUserData, dispatch])

  useEffect(() => {
    const open = () => setProfileModalOpen(true)
    window.addEventListener('openEditProfile', open)
    return () => window.removeEventListener('openEditProfile', open)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`)
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setProfileOpen(false)
    navigate('/login')
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const openModal = () => { setProfileOpen(false); setSidebarOpen(false); setProfileModalOpen(true) }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <WelcomePopup />

      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
      />

      <Toaster position="top-right" toastOptions={{
        style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px' }
      }} />

      {/* ─────────────────────── HEADER ─────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[3.75rem] bg-[#080808]/95 backdrop-blur-2xl border-b border-white/[.06]">
        <div className="flex items-center justify-between h-full px-4 gap-4">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors"
            >
              <Menu size={20} />
            </button>

           <Link to="/" className="flex items-center gap-2.5 group">
  {/* ── F Logo from public folder ── */}
  <div className="
    w-11 h-11
    sm:w-13 sm:h-13
    rounded-[12px]
    flex items-center justify-center
    flex-shrink-0
    overflow-hidden
    group-hover:scale-105
    transition-all duration-200
  "
  style={{ background: 'transparent' }}
  >
    <img
      src="/f-logo2.jpeg"
      alt="FaseehVision Logo"
      className="w-full h-full object-contain"
      style={{ mixBlendMode: 'screen' }}
    />
  </div>

  <span className="text-lg font-extrabold tracking-tight hidden sm:block">
    Faseeh<span className="text-red-500">Vision</span>
  </span>
</Link>
          </div>

          {/* Center: search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
            <div className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'scale-[1.015]' : ''}`}>
              <Search size={15} className="absolute left-4 text-zinc-500 pointer-events-none" />
              <input
                type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search videos, channels…"
                className="w-full bg-white/[.05] border border-white/[.08] rounded-2xl py-2.5 pl-10 pr-10 text-sm placeholder-zinc-600
                           focus:outline-none focus:border-red-500/40 focus:bg-white/[.07] transition-all"
              />
              <button type="submit"
                className="absolute right-1.5 w-7 h-7 bg-white/8 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                <Search size={14} />
              </button>
            </div>
          </form>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                const q = prompt('Search FaseehVision')
                if (q?.trim()) navigate(`/search?query=${encodeURIComponent(q)}`)
              }}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors"
            >
              <Search size={19} />
            </button>

            {isAuthenticated && (
              <>
                <Link to="/upload"
                  className="hidden sm:flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 px-3.5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-950/50">
                  <Upload size={15} /> Upload
                </Link>
                <NotificationBell />
              </>
            )}

            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-white/8 transition-colors group"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-[10px] overflow-hidden border border-white/15">
                      <img
                        src={currentUser?.avatar || user.avatar}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-md">
                      <Pencil size={7} />
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[17rem] bg-[#111111] border border-white/[.08] rounded-[1.4rem] shadow-[0_24px_72px_rgba(0,0,0,.85)] overflow-hidden z-50">

                    <div className="h-[3.5rem] relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950">
                      <img src={currentUser?.coverImages || user?.coverImages || ''} alt="cover"
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => { e.target.style.display = 'none' }} />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#111111]" />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-900/15 to-transparent" />
                    </div>

                    <div className="px-4 -mt-7 flex items-end justify-between">
                      <div className="relative group">
                        <div className="w-[3.25rem] h-[3.25rem] rounded-2xl overflow-hidden ring-[3px] ring-[#111111] border border-white/15 cursor-pointer shadow-xl"
                          onClick={openModal}>
                          <img src={currentUser?.avatar || user?.avatar || '/default-avatar.png'} alt={user.username}
                            className="w-full h-full object-cover group-hover:brightness-70 transition-all" />
                        </div>
                        <button onClick={openModal}
                          className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                          title="Edit profile">
                          <Pencil size={9} />
                        </button>
                      </div>
                      <button onClick={openModal}
                        className="mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-white/6 hover:bg-white/12 border border-white/10 hover:border-red-500/30 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95">
                        <Pencil size={10} />Edit Profile
                      </button>
                    </div>

                    <div className="px-4 pt-2.5 pb-4 border-b border-white/[.06]">
                      <p className="font-bold text-[15px] leading-tight truncate">{currentUser?.fullname || user.fullname}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">@{currentUser?.username || user.username}</p>
                      <div className="flex items-stretch gap-2 mt-3">
                        <div className="flex-1 bg-blue-600/10 border border-blue-500/15 rounded-xl px-2.5 py-2 flex flex-col items-center gap-0.5">
                          <span className="text-sm font-black text-blue-400 leading-none">{fmtCount(chanStats?.subcriberscount)}</span>
                          <span className="text-[9px] text-blue-400/60 font-semibold uppercase tracking-wider">Subs</span>
                        </div>
                        <div className="flex-1 bg-purple-600/10 border border-purple-500/15 rounded-xl px-2.5 py-2 flex flex-col items-center gap-0.5">
                          <span className="text-sm font-black text-purple-400 leading-none">{fmtCount(dashStats?.totalvideos ?? 0)}</span>
                          <span className="text-[9px] text-purple-400/60 font-semibold uppercase tracking-wider">Videos</span>
                        </div>
                        <div className="flex-1 bg-red-600/10 border border-red-500/15 rounded-xl px-2.5 py-2 flex flex-col items-center gap-0.5">
                          <span className="text-sm font-black text-red-400 leading-none">{fmtCount(dashStats?.totallikes ?? 0)}</span>
                          <span className="text-[9px] text-red-400/60 font-semibold uppercase tracking-wider">Likes</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      {[
                        { to: `/channel/${user.username}`, icon: UserIcon,        color: 'blue',   label: 'My Channel'   },
                        { to: '/dashboard',                icon: LayoutDashboard, color: 'purple', label: 'Dashboard'    },
                        { to: '/upload',                   icon: Upload,          color: 'green',  label: 'Upload Video' },
                      ].map(({ to, icon: Icon, color, label }) => (
                        <Link key={to} to={to} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors text-sm text-zinc-300 hover:text-white">
                          <div className={`w-7 h-7 bg-${color}-600/15 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon size={13} className={`text-${color}-400`} />
                          </div>
                          {label}
                        </Link>
                      ))}
                      <button onClick={openModal}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors text-sm text-zinc-300 hover:text-white">
                        <div className="w-7 h-7 bg-red-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pencil size={13} className="text-red-400" />
                        </div>
                        Edit Profile
                      </button>
                    </div>

                    <div className="p-1.5 border-t border-white/[.06]">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/8 text-red-400 hover:text-red-300 transition-colors text-sm">
                        <div className="w-7 h-7 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <LogOut size={13} />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="bg-white text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-zinc-100 active:scale-95 transition-all">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────── SIDEBAR ─────────────────────── */}
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed top-[3.75rem] left-0 bottom-0 z-40 flex flex-col
          bg-[#0b0b0b] border-r border-white/[.05]
          transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-60' : 'w-0 md:w-[68px]'}
        `}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-hide">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ icon: Icon, label, path, color, activeBg, activeBar, activeDot, hoverColor, glow }) => {
                const active = isActive(path)
                return (
                  <Link
                    key={path} to={path}
                    onClick={() => setSidebarOpen(false)}
                    title={!sidebarOpen ? label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-150 group relative
                      ${active
                        ? `${activeBg} ${color} font-bold`
                        : `text-zinc-500 hover:bg-white/5 ${hoverColor} font-semibold`
                      }
                    `}
                  >
                    {/* Colored active left bar */}
                    {active && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 ${activeBar} rounded-full`} />
                    )}

                    {/* Icon with glow when active */}
                    <Icon
                      size={20}
                      className={`flex-shrink-0 transition-all duration-200 ${active ? glow : ''}`}
                    />

                    {/* Label */}
                    <span className={`text-sm whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                      {label}
                    </span>

                    {/* Active trailing dot */}
                    {active && sidebarOpen && (
                      <span className={`ml-auto w-1.5 h-1.5 ${activeDot} rounded-full flex-shrink-0 shadow-lg`} />
                    )}
                  </Link>
                )
              })}
            </nav>

            {sidebarOpen && (
              <div className="mt-5 pt-5 border-t border-white/[.05]">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[.18em] px-3 mb-2">Explore</p>
                <nav className="space-y-0.5">
                  {CATEGORIES.map(({ icon: Icon, label }) => (
                    <button key={label}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors text-sm font-medium">
                      <Icon size={17} className="flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {sidebarOpen && isAuthenticated && user && (
            <div className="p-2.5 border-t border-white/[.05] space-y-2">
              <div className="flex items-center gap-2.5 px-2.5 py-2.5 bg-white/[.03] rounded-2xl border border-white/[.05]">
                <div className="relative flex-shrink-0">
                  <img
                    src={currentUser?.avatar || user.avatar || '/default-avatar.png'}
                    alt={user.username}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                  />
                  <button onClick={openModal}
                    className="absolute -bottom-1 -right-1 w-[1.1rem] h-[1.1rem] bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
                    title="Edit profile">
                    <Pencil size={8} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">{currentUser?.fullname || user.fullname}</p>
                  <p className="text-[10px] text-zinc-600 truncate mt-0.5">@{currentUser?.username || user.username}</p>
                </div>
              </div>
              <Link to="/upload" onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[.98] shadow-lg shadow-red-950/50">
                <Upload size={15} /> Upload Video
              </Link>
            </div>
          )}
        </aside>
      </>

      {/* ─────────────────────── MAIN ─────────────────────── */}
      <main className={`pt-[3.75rem] transition-all duration-300 ${sidebarOpen ? 'md:ml-60' : 'md:ml-[68px]'}`}>
        <div className="p-4 md:p-6 min-h-[calc(100vh-3.75rem)]">
          <Outlet />
        </div>
      </main>

      <InstallBanner />
    </div>
  )
}