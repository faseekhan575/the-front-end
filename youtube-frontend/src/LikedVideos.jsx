// src/LikedVideos.jsx
import { useGetLikedVideosQuery } from './apiSlice'
import { Link } from 'react-router-dom'
import { ThumbsUp, Eye, Clock } from 'lucide-react'

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n
}

export default function LikedVideos() {
  const { data, isLoading, isError } = useGetLikedVideosQuery()

  const likedVideos = Array.isArray(data?.data) ? data.data :
    Array.isArray(data) ? data : []

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-white/6 rounded-xl w-48 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="aspect-video bg-white/6 rounded-2xl mb-3"></div>
              <div className="h-3.5 bg-white/6 rounded-xl w-3/4 mb-2"></div>
              <div className="h-3 bg-white/6 rounded-xl w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-32">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-semibold">Error loading liked videos</h2>
      </div>
    )
  }

  if (likedVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-6">
          <ThumbsUp size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No liked videos yet</h2>
        <p className="text-zinc-400 text-sm max-w-sm">Videos you like will appear here. Start exploring and like videos you enjoy!</p>
        <Link to="/" className="mt-6 bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          Browse Videos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-red-600/15 rounded-2xl flex items-center justify-center">
          <ThumbsUp size={22} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Liked Videos</h1>
          <p className="text-zinc-400 text-sm">{likedVideos.length} videos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {likedVideos.map((item, index) => {
          const video = item?.videos || item
          if (!video?._id) return null
          return (
            <Link to={`/watch/${video._id}`} key={video._id || index} className="group">
              <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-3">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded-lg font-semibold">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-red-400 transition-colors">{video.title}</h3>
              <p className="text-xs text-zinc-400">{video.owner?.fullname || 'Unknown'}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <Eye size={11} />
                <span>{formatNum(video.views)} views</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}