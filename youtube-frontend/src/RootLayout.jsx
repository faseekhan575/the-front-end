// src/RootLayout.jsx
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import { useGetCurrentUserQuery } from './apiSlice'
import { setUser, logout } from './authSlice'
import {
  Menu, Search, Upload, Bell, Home, PlayCircle,
  Library, History, ThumbsUp, Users, LayoutDashboard,
  LogOut, ChevronDown, Flame, TrendingUp, Tv2,
  Mic2, Gamepad2, BookOpen, Zap
} from 'lucide-react'
import { Toaster } from 'sonner'
import WelcomePopup from './Welcomepopup'

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Subscriptions', path: '/subscriptions' },
  { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Library, label: 'Playlists', path: '/playlists' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
]

const CATEGORIES = [
  { icon: Flame, label: 'Trending' },
  { icon: TrendingUp, label: 'New' },
  { icon: Gamepad2, label: 'Gaming' },
  { icon: Mic2, label: 'Music' },
  { icon: Tv2, label: 'Live' },
  { icon: BookOpen, label: 'Education' },
  { icon: Zap, label: 'Shorts' },
]

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const { data: currentUserData } = useGetCurrentUserQuery(undefined, { skip: isAuthenticated })

  useEffect(() => {
    if (currentUserData?.data) dispatch(setUser(currentUserData.data))
  }, [currentUserData, dispatch])

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

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <WelcomePopup />

      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: '16px' }
      }} />

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between h-full px-4 gap-4">

          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors">
              <Menu size={22} />
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:shadow-red-900/60 transition-shadow">
                <PlayCircle size={20} className="text-white" fill="white" />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">
                Faseeh<span className="text-red-500">Vision</span>
              </span>
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search videos, channels..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-5 pr-12 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all" />
              <button type="submit" className="absolute right-1.5 w-8 h-8 bg-white/8 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { const q = prompt('Search FaseehVision'); if (q?.trim()) navigate(`/search?query=${encodeURIComponent(q)}`) }}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors">
              <Search size={20} />
            </button>

            {isAuthenticated && (
              <>
                <Link to="/upload" className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                  <Upload size={16} /> Upload
                </Link>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </>
            )}

            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/8 transition-colors">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/15">
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover"
                      onError={e => e.target.src = '/default-avatar.png'} />
                  </div>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                          <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{user.fullname}</p>
                          <p className="text-sm text-zinc-400 truncate">@{user.username}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link to={`/channel/${user.username}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors text-sm">
                        <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Users size={14} className="text-blue-400" />
                        </div>
                        My Channel
                      </Link>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors text-sm">
                        <div className="w-7 h-7 bg-purple-600/20 rounded-lg flex items-center justify-center">
                          <LayoutDashboard size={14} className="text-purple-400" />
                        </div>
                        Dashboard
                      </Link>
                      <Link to="/upload" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors text-sm">
                        <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center">
                          <Upload size={14} className="text-red-400" />
                        </div>
                        Upload Video
                      </Link>
                    </div>
                    <div className="p-2 border-t border-white/8">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-sm">
                        <div className="w-7 h-7 bg-red-600/10 rounded-lg flex items-center justify-center">
                          <LogOut size={14} />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-white text-black px-5 py-2 rounded-xl font-semibold text-sm hover:bg-zinc-100 transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed top-16 left-0 bottom-0 z-40 flex flex-col
          bg-[#0d0d0d] border-r border-white/5
          transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0 md:w-[72px]'}
        `}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                const active = isActive(path)
                return (
                  <Link key={path} to={path} onClick={() => setSidebarOpen(false)} title={!sidebarOpen ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                      active ? 'bg-red-600/15 text-red-400' : 'hover:bg-white/6 text-zinc-400 hover:text-white'
                    }`}>
                    <Icon size={20} className="flex-shrink-0" />
                    <span className={`text-sm font-medium whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                      {label}
                    </span>
                    {active && <div className="ml-auto w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />}
                  </Link>
                )
              })}
            </nav>

            {sidebarOpen && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-3">Explore</p>
                <nav className="space-y-1">
                  {CATEGORIES.map(({ icon: Icon, label }) => (
                    <button key={label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 text-zinc-400 hover:text-white transition-colors text-sm">
                      <Icon size={18} className="flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {sidebarOpen && isAuthenticated && (
            <div className="p-3 border-t border-white/5">
              <Link to="/upload" onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Upload size={16} /> Upload Video
              </Link>
            </div>
          )}
        </aside>
      </>

      {/* ── MAIN ── */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-[72px]'}`}>
        <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}