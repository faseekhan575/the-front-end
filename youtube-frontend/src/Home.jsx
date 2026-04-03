// src/Home.jsx
// FINAL ULTIMATE HOME PAGE - Fully Fixed Version

import { useState, useEffect, useMemo } from 'react'
import { useGetAllVideosQuery } from './apiSlice'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Eye, Clock, Search as SearchIcon, TrendingUp, Play, X, LogIn, Heart } from 'lucide-react'
import WelcomePopup from './Welcomepopup'

const CATEGORIES = [
  'All', 'Gaming', 'Music', 'Mixes', 'Live', 'Programming',
  'Podcasts', 'Education', 'Sports', 'News', 'Recently uploaded'
]

const formatViews = (views) => {
  if (!views && views !== 0) return '0'
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
  return views.toString()
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "y ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "mo ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "d ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + "h ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + "m ago"
  return "just now"
}

const formatDuration = (s) => {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Premium Video Card ─────────────────────────────────────────────────────
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

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-2xl">
          {formatDuration(video.duration)}
        </div>

        {/* Trending Badge */}
        {isRecent && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-3 h-6 rounded-2xl shadow-inner">
            <TrendingUp size={12} />
            TRENDING
          </div>
        )}

        {/* Play Overlay */}
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

// ─── Shimmer Skeleton ───────────────────────────────────────────────────────
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

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '')

  const searchTerm = searchParams.get('search') || ''
  const activeCategory = searchParams.get('category') || 'All'

  // Get authentication status from Redux
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Debounce search input
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

  // Only fetch videos if user is logged in
  const { data: videosData, isLoading, isFetching, isError, error } = useGetAllVideosQuery(
    isAuthenticated 
      ? { 
          page: 1, 
          limit: 30, 
          query: searchTerm 
        } 
      : undefined,
    { 
      skip: !isAuthenticated 
    }
  )

  const videos = videosData?.data || []

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'All') return videos

    const term = activeCategory.toLowerCase()
    return videos.filter((video) => {
      const title = (video.title || '').toLowerCase()
      const desc = (video.description || '').toLowerCase()
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

  // Show login prompt when user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WelcomePopup />

        <div className="mb-12 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-10 md:p-16 text-center">
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-red-500" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Welcome to the Family
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Hi, this is Faseeh Khan — welcome to our YouTube app!
Join our growing community of creators, dreamers, and viewers.
Watch, like, comment, upload, and manage everything from one dashboard.
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
            Don’t have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 underline">
              Create one — it’s free
            </Link>
          </p>
        </div>

        {/* Optional: Show a teaser message */}
        <div className="text-center text-zinc-500 text-sm mt-8">
          faseeh khan . everything is possible when you have dreams
        </div>
      </div>
    )
  }

  // Show error state only for logged-in users
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="text-7xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold mb-3">Failed to load videos</h2>
        <p className="text-red-400 mb-6 max-w-md">
          {error?.data?.message || error?.error || "Something went wrong while fetching videos."}
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <WelcomePopup />

      {/* HERO SECTION WITH FASEEH VISION BRANDING */}
      <div className="relative mb-10">
        <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
          
          <div className="hidden lg:flex flex-1 items-center justify-center relative">
            <div className="w-72 h-72 bg-red-600/10 rounded-[4rem] rotate-12 flex items-center justify-center">
              <div className="text-[180px] opacity-10">🎥</div>
            </div>
            <div className="absolute text-white font-black text-6xl tracking-tighter -rotate-12 leading-none">
              FASEEH<span className="text-red-500">VISION</span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-center md:text-left mb-2">
              What are you watching today?
            </h1>
            <p className="text-zinc-400 text-center md:text-left mb-8 text-lg">
              Discover millions of videos from creators around the world
            </p>

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

      {/* Category Chips + Clear Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide snap-x flex-1">
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

      {/* Results Info */}
      {hasActiveFilter && (
        <div className="flex items-baseline justify-between mb-6 px-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {searchTerm ? `Results for “${searchTerm}”` : activeCategory}
          </h2>
          <span className="text-zinc-400 text-sm font-medium">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
        {isLoading ? (
          [...Array(12)].map((_, i) => <VideoSkeleton key={i} />)
        ) : (
          filteredVideos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))
        )}
      </div>

      {/* Empty State */}
      {!isLoading && filteredVideos.length === 0 && (
        <div className="py-28 text-center">
          <div className="text-8xl mb-6 opacity-40">🔎</div>
          <h3 className="text-2xl font-semibold mb-2">
            {searchTerm ? `No results for “${searchTerm}”` : 'No videos found'}
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            {searchTerm
              ? 'Try different keywords or remove some filters.'
              : 'We couldn’t find any videos matching this category right now.'}
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

      {isFetching && !isLoading && (
        <div className="text-center py-8 text-zinc-400 text-sm flex items-center justify-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          Loading more videos...
        </div>
      )}

      <div className="text-center text-xs text-zinc-500 mt-16 opacity-70">
        FaseehVision . everything is possible when you have dreams
      </div>
    </div>
  )
}