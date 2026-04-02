// src/Dashboard.jsx
import { useGetChannelStatsQuery, useGetMyVideosQuery } from './apiSlice'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Eye, ThumbsUp, Users, Video, TrendingUp, Upload, BarChart3, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function StatCard({ icon: Icon, label, value, color, bgColor, change }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/6 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={color} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
            <TrendingUp size={11} />
            {change}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold mb-1">{formatNum(value)}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetChannelStatsQuery()
  const { data: myVideosData, isLoading: videosLoading } = useGetMyVideosQuery()
  const user = useSelector((state) => state.auth.user)

  const stats = statsData?.data?.[0] || {}
  const videos = myVideosData?.data || []

  const handleDelete = (videoId) => {
    toast.info("Delete functionality coming soon")
  }

  if (statsLoading || videosLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-white/6 rounded-xl w-64 mb-8"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/4 rounded-2xl p-5 border border-white/8 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8">
              <div className="aspect-video bg-white/6"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/6 rounded w-3/4"></div>
                <div className="h-3 bg-white/6 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {user?.avatar && (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="text-2xl font-bold">Channel Dashboard</h1>
          </div>
          <p className="text-zinc-400 text-sm">@{user?.username} · Your analytics at a glance</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-900/30 w-fit"
        >
          <Upload size={17} />
          Upload Video
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Eye} label="Total Views" value={stats.totalviews} color="text-blue-400" bgColor="bg-blue-600/15" change={12} />
        <StatCard icon={Users} label="Subscribers" value={stats.totalsubs} color="text-emerald-400" bgColor="bg-emerald-600/15" change={5} />
        <StatCard icon={ThumbsUp} label="Total Likes" value={stats.totallikes} color="text-red-400" bgColor="bg-red-600/15" change={8} />
        <StatCard icon={Video} label="Videos" value={stats.totalvideos} color="text-purple-400" bgColor="bg-purple-600/15" />
      </div>

      {/* Quick insights banner */}
      <div className="bg-gradient-to-r from-red-950/40 to-transparent border border-red-900/30 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <BarChart3 size={20} className="text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Your channel is growing!</p>
          <p className="text-xs text-zinc-400 mt-0.5">Keep uploading consistently to increase your reach and subscriber count.</p>
        </div>
      </div>

      {/* Videos */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">Your Videos</h2>
        <span className="text-sm text-zinc-500">{videos.length} videos</span>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <Play size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 font-medium mb-4">You haven't uploaded any videos yet</p>
          <Link to="/upload" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Upload size={16} />
            Upload your first video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => (
            <div key={video._id} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group">
              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded-lg font-semibold">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link to={`/watch/${video._id}`} className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-3">{video.title}</h3>

                <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{formatNum(video.views)} views</span>
                  </div>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/8 hover:bg-white/12 py-2 rounded-xl text-xs font-medium transition-colors border border-white/8">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(video._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/8 hover:bg-red-900/25 text-zinc-400 hover:text-red-400 py-2 rounded-xl text-xs font-medium transition-all border border-white/8"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}