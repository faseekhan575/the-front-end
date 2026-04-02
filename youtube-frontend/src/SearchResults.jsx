// src/SearchResults.jsx
import { useSearchParams, Link } from 'react-router-dom'
import { useGetAllVideosQuery } from './apiSlice'
import { useEffect, useState } from 'react'
import { Search, Eye, Clock, SlidersHorizontal } from 'lucide-react'

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "y ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "mo ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "d ago"
  return Math.floor(seconds / 3600) + "h ago"
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const [searchTerm, setSearchTerm] = useState(query)

  const { data: videosData, isLoading } = useGetAllVideosQuery({ query: searchTerm, page: 1, limit: 20 })
  const videos = videosData?.data || []

  useEffect(() => {
    if (query) setSearchTerm(query)
  }, [query])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Search header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search size={18} className="text-zinc-400" />
            <h1 className="text-lg font-bold">
              Results for <span className="text-red-400">"{searchTerm}"</span>
            </h1>
          </div>
          <p className="text-sm text-zinc-500">{isLoading ? '...' : `${videos.length} results found`}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-48 flex-shrink-0 aspect-video bg-white/6 rounded-2xl"></div>
              <div className="flex-1 py-2 space-y-2">
                <div className="h-4 bg-white/6 rounded-xl w-full"></div>
                <div className="h-4 bg-white/6 rounded-xl w-3/4"></div>
                <div className="h-3 bg-white/6 rounded-xl w-1/3 mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-32">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No results for "{searchTerm}"</h2>
          <p className="text-zinc-400 text-sm">Try different keywords or browse the home feed</p>
          <Link to="/" className="mt-6 inline-block bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Go Home
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <Link to={`/watch/${video._id}`} key={video._id} className="group flex gap-4 p-3 rounded-2xl hover:bg-white/4 transition-colors">
              {/* Thumbnail */}
              <div className="relative w-48 flex-shrink-0 aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded-lg font-semibold">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye size={11} />
                    {formatNum(video.views)} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(video.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img src={video.owner?.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <Link
                    to={`/channel/${video.owner?.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-medium"
                  >
                    {video.owner?.fullname || video.owner?.username}
                  </Link>
                </div>
                {video.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2 mt-2">{video.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}