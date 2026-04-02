// src/Home.jsx
import { useState } from 'react'
import { useGetAllVideosQuery } from './apiSlice'
import { Link } from 'react-router-dom'
import { Eye, Clock } from 'lucide-react'

const CATEGORIES = ['All', 'Gaming', 'Music', 'Mixes', 'Live', 'Programming', 'Podcasts', 'Education', 'Sports', 'News', 'Recently uploaded']

const formatViews = (views) => {
  if (!views) return '0'
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
  return views
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return "Just now"
}

const formatDuration = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white/6 aspect-video rounded-2xl mb-3"></div>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-white/6 flex-shrink-0 mt-0.5"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-white/6 rounded-lg w-full"></div>
          <div className="h-3.5 bg-white/6 rounded-lg w-3/4"></div>
          <div className="h-3 bg-white/6 rounded-lg w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video }) {
  return (
    <Link to={`/watch/${video._id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-3">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-lg tracking-wide">
          {formatDuration(video.duration)}
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
            <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[18px] border-t-transparent border-b-transparent border-l-white ml-1" />
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex gap-3">
        <Link
          to={`/channel/${video.owner?.username}`}
          onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 mt-0.5 bg-zinc-800 ring-1 ring-white/10 hover:ring-red-500/50 transition-all"
        >
          <img
            src={video.owner?.avatar || '/default-avatar.png'}
            alt={video.owner?.username}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors mb-1">
            {video.title}
          </h3>
          <Link
            to={`/channel/${video.owner?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-medium"
          >
            {video.owner?.fullname || video.owner?.username}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
            <Eye size={11} />
            <span>{formatViews(video.views)} views</span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
            <Clock size={11} />
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery] = useState('')

  const { data: videosData, isLoading, isError } = useGetAllVideosQuery({
    page: 1,
    limit: 16,
    query: searchQuery,
  })

  const videos = videosData?.data || []

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold mb-2">Failed to load videos</h2>
        <p className="text-zinc-400 text-sm">Check your connection and try again</p>
      </div>
    )
  }

  return (
    <div>
      {/* Category Chips */}
      <div className="flex gap-2.5 overflow-x-auto pb-5 mb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-all
              ${activeCategory === cat
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/8 hover:bg-white/12 text-zinc-300 hover:text-white border border-white/8'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {isLoading
          ? [...Array(12)].map((_, i) => <VideoSkeleton key={i} />)
          : videos.map((video) => <VideoCard key={video._id} video={video} />)
        }
      </div>

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold mb-2">No videos found</h2>
          <p className="text-zinc-400 text-sm">Be the first to upload something!</p>
        </div>
      )}
    </div>
  )
}