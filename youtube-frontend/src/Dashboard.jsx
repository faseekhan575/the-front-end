// src/Dashboard.jsx
import { useGetChannelStatsQuery, useGetMyVideosQuery, useDeleteVideoMutation, useTogglePublishMutation } from './apiSlice'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Eye, ThumbsUp, Users, Video, TrendingUp, Upload, BarChart3, Play, EyeOff, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { useState } from 'react'

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/6 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={color} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1">{formatNum(value)}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}

function DeleteModal({ video, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="w-12 h-12 bg-red-600/15 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h3 className="font-bold text-lg mb-2">Delete Video?</h3>
        <p className="text-sm text-zinc-400 mb-6">
          "<span className="text-white">{video?.title}</span>" will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/12 rounded-xl text-sm font-medium hover:bg-white/6 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetChannelStatsQuery()
  const { data: myVideosData, isLoading: videosLoading, refetch } = useGetMyVideosQuery()
  const [deleteVideo] = useDeleteVideoMutation()
  const [togglePublish] = useTogglePublishMutation()

  const user = useSelector((state) => state.auth.user)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)   // ← prevents double click

  const stats = statsData?.data?.[0] || {}
  const videos = myVideosData?.data || []

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVideo(deleteTarget._id).unwrap()
      toast.success('Video deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch {
      toast.error('Failed to delete video')
      setDeleteTarget(null)
    }
  }

  const handleTogglePublish = async (video) => {
    if (togglingId) return
    setTogglingId(video._id)

    const wasPublished = video.isPublished

    try {
      await togglePublish(video._id).unwrap()
      
      // ✅ Correct toast (shows what actually happened)
      toast.success(wasPublished ? 'Video unpublished' : 'Video published')
      
      // RTK Query already invalidates + refetches because of tags
      // We call refetch for extra safety and instant feel
      refetch()
    } catch {
      toast.error('Failed to toggle publish status')
    } finally {
      setTogglingId(null)
    }
  }

  if (statsLoading || videosLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-white/6 rounded-xl w-64 mb-8"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white/4 rounded-2xl p-5 border border-white/8 h-32"></div>)}
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
      {deleteTarget && (
        <DeleteModal video={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

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
          <p className="text-zinc-400 text-sm">@{user?.username} · Your analytics</p>
        </div>
        <Link to="/upload" className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-900/30 w-fit">
          <Upload size={16} /> Upload Video
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={stats.totalviews} color="text-blue-400" bgColor="bg-blue-600/15" />
        <StatCard icon={Users} label="Subscribers" value={stats.totalsubs} color="text-emerald-400" bgColor="bg-emerald-600/15" />
        <StatCard icon={ThumbsUp} label="Total Likes" value={stats.totallikes} color="text-red-400" bgColor="bg-red-600/15" />
        <StatCard icon={Video} label="Videos" value={stats.totalvideos} color="text-purple-400" bgColor="bg-purple-600/15" />
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950/40 to-transparent border border-red-900/30 rounded-2xl p-4 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <BarChart3 size={20} className="text-red-400" />
        </div>
        <p className="text-sm">Keep uploading consistently to grow your channel and reach more viewers! 🚀</p>
      </div>

      {/* Videos */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">Your Videos <span className="text-zinc-500 font-normal text-sm ml-2">{videos.length}</span></h2>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <Play size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 font-medium mb-4">No videos uploaded yet</p>
          <Link to="/upload" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Upload size={15} /> Upload first video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map(video => (
            <div key={video._id} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group">
              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                <img src={video.thumbnail} alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded-lg font-semibold">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>

                {/* ✅ Published badge - updates instantly after toggle */}
                <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-lg font-semibold ${video.isPublished ? 'bg-emerald-500/80 text-white' : 'bg-zinc-700/80 text-zinc-300'}`}>
                  {video.isPublished ? 'Published' : 'Private'}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link to={`/watch/${video._id}`} onClick={e => e.stopPropagation()}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Play size={18} fill="white" className="text-white ml-0.5" />
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-3">{video.title}</h3>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                  <div className="flex items-center gap-1"><Eye size={11} /> {formatNum(video.views)} views</div>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Link to={`/watch/${video._id}`}
                    className="flex items-center justify-center gap-1 bg-white/8 hover:bg-white/12 py-2 rounded-xl text-xs font-medium transition-colors border border-white/8">
                    <Play size={12} /> Watch
                  </Link>

                  {/* ✅ FIXED TOGGLE BUTTON */}
                  <button 
                    onClick={() => handleTogglePublish(video)}
                    disabled={togglingId === video._id}
                    className="flex items-center justify-center gap-1 bg-white/8 hover:bg-white/12 py-2 rounded-xl text-xs font-medium transition-colors border border-white/8 disabled:opacity-50"
                  >
                    {togglingId === video._id ? (
                      <>Updating...</>
                    ) : video.isPublished ? (
                      <><EyeOff size={12} /> Hide</>
                    ) : (
                      <><Eye size={12} /> Publish</>
                    )}
                  </button>

                  <button onClick={() => setDeleteTarget(video)}
                    className="flex items-center justify-center gap-1 bg-white/8 hover:bg-red-900/25 text-zinc-400 hover:text-red-400 py-2 rounded-xl text-xs font-medium transition-all border border-white/8">
                    <Trash2 size={12} /> Delete
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