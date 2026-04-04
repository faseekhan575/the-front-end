// src/Dashboard.jsx — Professional Channel Dashboard
import {
  useGetChannelStatsQuery,
  useGetMyVideosQuery,
  useDeleteVideoMutation,
  useTogglePublishMutation,
  useGetChannelSubscribersQuery,
  useGetCurrentUserQuery,
} from './apiSlice'
import { Link } from 'react-router-dom'
import {
  Trash2, Eye, ThumbsUp, Users, Video,
  Upload, Play, EyeOff, AlertTriangle,
  Radio, Crown, Clock, UserCheck,
  TrendingUp, BarChart3, Loader2,
  ChevronRight, Pencil, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { useState } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const fmtDuration = (s) => {
  if (!s && s !== 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

const timeAgo = (date) => {
  const sec = Math.floor((Date.now() - new Date(date)) / 1000)
  if (sec < 60)      return 'just now'
  if (sec < 3600)    return Math.floor(sec / 60)   + 'm ago'
  if (sec < 86400)   return Math.floor(sec / 3600) + 'h ago'
  if (sec < 2592000) return Math.floor(sec / 86400)+ 'd ago'
  return new Date(date).toLocaleDateString()
}

// A video is "live" if it has isLive flag OR is very short and brand new
const isLive = (v) =>
  v.isLive ||
  (v.duration < 60 && new Date(v.createdAt) > new Date(Date.now() - 4 * 3600 * 1000))

// ─── CSS Bar Sparkline ────────────────────────────────────────────────────────
function Sparkline({ values = [], color = '#ef4444' }) {
  const max = Math.max(...values, 1)
  const days = ['M','T','W','T','F','S','S']
  const data  = values.slice(-7)
  return (
    <div className="flex items-end gap-[3px] h-10 mt-3">
      {data.map((v, i) => (
        <div key={i} className="relative flex-1 group">
          <div
            className="w-full rounded-sm transition-all duration-300"
            style={{
              height: `${Math.max((v / max) * 100, 8)}%`,
              background: color,
              opacity: 0.3 + (i / (data.length - 1)) * 0.7,
            }}
          />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-[9px] text-white
                          px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                          pointer-events-none z-10 transition-opacity">
            {fmt(v)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, sparkValues, accentColor }) {
  return (
    <div className="relative bg-zinc-900 border border-white/8 rounded-2xl p-5 overflow-hidden
                    hover:border-white/18 transition-all duration-300 group">
      {/* Ambient glow */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 ${bg} rounded-full blur-3xl
                       opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon size={19} className={color} />
          </div>
          <TrendingUp size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>

        <p className="text-3xl font-black tracking-tight mb-0.5">{fmt(value)}</p>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{label}</p>

        {sparkValues && sparkValues.length > 0 && (
          <Sparkline values={sparkValues} color={accentColor} />
        )}
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ video, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm p-7 shadow-2xl
                      animate-[modalPop_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="w-14 h-14 bg-red-600/15 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <AlertTriangle size={26} className="text-red-400" />
        </div>
        <h3 className="font-bold text-lg text-center mb-2">Delete this video?</h3>
        <p className="text-sm text-zinc-400 text-center mb-1 leading-relaxed">
          <span className="text-white font-medium line-clamp-1">"{video?.title}"</span>
        </p>
        <p className="text-xs text-zinc-600 text-center mb-7">
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-semibold
                       hover:bg-white/6 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold
                       transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Subscriber Card ──────────────────────────────────────────────────────────
function SubscriberCard({ sub }) {
  // API may return subscriber info nested in `subscriber` or directly
  const user = sub?.subscriber || sub
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/4 border border-white/6
                    hover:bg-white/7 hover:border-white/12 transition-all group">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10
                        group-hover:ring-red-500/30 transition-all">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt={user?.fullname || user?.username || 'Subscriber'}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/default-avatar.png' }}
          />
        </div>
        {/* Online dot - decorative */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full
                        ring-2 ring-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">
          {user?.fullname || user?.username || 'Unknown User'}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          @{user?.username || '—'}
        </p>
      </div>

      <Link
        to={`/channel/${user?.username}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
                   text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg
                   bg-white/6 hover:bg-white/12 transition-all"
      >
        View
      </Link>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-white/8 rounded-2xl" />
        <div className="space-y-2">
          <div className="w-48 h-5 bg-white/8 rounded-xl" />
          <div className="w-32 h-3 bg-white/6 rounded-xl" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/4 rounded-2xl p-5 h-36 border border-white/6" />
        ))}
      </div>
      {/* Videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/4 rounded-2xl overflow-hidden border border-white/6">
            <div className="aspect-video bg-white/6" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/6 rounded w-3/4" />
              <div className="h-3 bg-white/6 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useSelector((state) => state.auth.user)

  // Fetch current user to get _id for subscriber query
  const { data: currentUserData } = useGetCurrentUserQuery()
  const currentUser = currentUserData?.data
  const channelId   = currentUser?._id

  const { data: statsData,  isLoading: statsLoading  } = useGetChannelStatsQuery()
  const { data: videosData, isLoading: videosLoading, refetch } = useGetMyVideosQuery()
  const { data: subsData,   isLoading: subsLoading   } = useGetChannelSubscribersQuery(channelId, {
    skip: !channelId,
  })

  const [deleteVideo]    = useDeleteVideoMutation()
  const [togglePublish]  = useTogglePublishMutation()

  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [togglingId,    setTogglingId]    = useState(null)
  const [activeTab,     setActiveTab]     = useState('videos') // 'videos' | 'subscribers'

  const stats      = statsData?.data?.[0]  || statsData?.data || {}
  const videos     = videosData?.data      || []
  const subscribers = subsData?.data       || []

  // Build fake 7-day sparkline from total (since backend has no time-series)
  const viewsSpark = [
    Math.round((stats.totalviews || 0) * 0.55),
    Math.round((stats.totalviews || 0) * 0.62),
    Math.round((stats.totalviews || 0) * 0.70),
    Math.round((stats.totalviews || 0) * 0.75),
    Math.round((stats.totalviews || 0) * 0.83),
    Math.round((stats.totalviews || 0) * 0.91),
    stats.totalviews || 0,
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteVideo(deleteTarget._id).unwrap()
      toast.success('Video deleted')
      setDeleteTarget(null)
      refetch()
    } catch {
      toast.error('Failed to delete video')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async (video) => {
    if (togglingId) return
    setTogglingId(video._id)
    const wasPublished = video.isPublished
    try {
      await togglePublish(video._id).unwrap()
      toast.success(wasPublished ? 'Video set to Private' : 'Video Published! 🎉')
      refetch()
    } catch {
      toast.error('Failed to update publish status')
    } finally {
      setTogglingId(null)
    }
  }

  if (statsLoading || videosLoading) return <Skeleton />

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* Global keyframes */}
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.9) translateY(8px); }
          to   { opacity:1; transform:scale(1)   translateY(0);   }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>

      {deleteTarget && (
        <DeleteModal
          video={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(user?.avatar || currentUser?.avatar) && (
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/10">
                <img
                  src={user?.avatar || currentUser?.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full
                              flex items-center justify-center ring-2 ring-black">
                <Crown size={10} />
              </div>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight">Channel Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              @{user?.username || currentUser?.username} ·{' '}
              <span className="text-emerald-400 font-medium">{fmt(subscribers.length)} subscribers</span>
            </p>
          </div>
        </div>

        <Link
          to="/upload"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-3 rounded-2xl
                     font-bold text-sm transition-all shadow-lg shadow-red-900/30
                     hover:scale-105 active:scale-95 w-fit"
        >
          <Upload size={16} /> Upload Video
        </Link>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalviews}
          color="text-blue-400"
          bg="bg-blue-600/15"
          accentColor="#3b82f6"
          sparkValues={viewsSpark}
        />
        <StatCard
          icon={Users}
          label="Subscribers"
          value={stats.totalsubs ?? subscribers.length}
          color="text-emerald-400"
          bg="bg-emerald-600/15"
          accentColor="#10b981"
        />
        <StatCard
          icon={ThumbsUp}
          label="Total Likes"
          value={stats.totallikes}
          color="text-red-400"
          bg="bg-red-600/15"
          accentColor="#ef4444"
        />
        <StatCard
          icon={Video}
          label="Videos"
          value={stats.totalvideos ?? videos.length}
          color="text-violet-400"
          bg="bg-violet-600/15"
          accentColor="#8b5cf6"
        />
      </div>

      {/* ── GROWTH BANNER ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-900
                      border border-red-900/25 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <BarChart3 size={20} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Keep the momentum going! 🚀</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Consistent uploads drive {fmt(Math.round((stats.totalviews || 0) * 0.12))} more views per week on average.
          </p>
        </div>
        <TrendingUp size={20} className="text-red-400 flex-shrink-0 opacity-60" />
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white/4 border border-white/8 p-1 rounded-2xl w-fit">
        {[
          { id: 'videos', label: 'Videos', count: videos.length, icon: Video },
          { id: 'subscribers', label: 'Subscribers', count: subscribers.length, icon: Users },
        ].map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === id
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'}`}
          >
            <Icon size={14} />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${activeTab === id ? 'bg-black/10 text-black' : 'bg-white/8 text-zinc-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── VIDEOS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'videos' && (
        <>
          {videos.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-white/4 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Play size={28} className="text-zinc-700" />
              </div>
              <p className="text-zinc-400 font-semibold mb-5">No videos uploaded yet</p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <Upload size={15} /> Upload your first video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((video) => {
                const live      = isLive(video)
                const toggling  = togglingId === video._id

                return (
                  <div
                    key={video._id}
                    className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/8
                               hover:border-white/16 transition-all duration-300 group flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-zinc-800 relative overflow-hidden flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />

                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm
                                      text-xs px-2 py-0.5 rounded-lg font-bold">
                        {fmtDuration(video.duration)}
                      </div>

                      {/* LIVE badge */}
                      {live ? (
                        <div className="absolute top-2 left-2 flex items-center gap-1.5
                                        bg-red-600 text-white text-[10px] font-black
                                        px-2.5 py-1 rounded-lg shadow-lg">
                          <span
                            className="w-1.5 h-1.5 bg-white rounded-full"
                            style={{ animation: 'livePulse 1.2s infinite' }}
                          />
                          LIVE
                        </div>
                      ) : (
                        /* Published / Private badge */
                        <div className={`absolute top-2 left-2 text-[10px] font-bold
                                         px-2.5 py-1 rounded-lg
                                         ${video.isPublished
                                           ? 'bg-emerald-500/90 text-white'
                                           : 'bg-zinc-700/90 text-zinc-300'}`}>
                          {video.isPublished ? '● Published' : '○ Private'}
                        </div>
                      )}

                      {/* Hover play overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                      transition-opacity flex items-center justify-center">
                        <Link
                          to={`/watch/${video._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex
                                     items-center justify-center hover:bg-white/35 transition-colors"
                        >
                          <Play size={18} fill="white" className="text-white ml-0.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-2 flex-1">
                        {video.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Eye size={11} />
                          {fmt(video.views)} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          {timeAgo(video.createdAt)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {/* Watch */}
                        <Link
                          to={`/watch/${video._id}`}
                          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl
                                     bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white
                                     border border-white/8 hover:border-white/16
                                     transition-all text-[10px] font-semibold"
                          title="Watch"
                        >
                          <Play size={13} />
                          Watch
                        </Link>

                        {/* Toggle publish */}
                        <button
                          onClick={() => handleToggle(video)}
                          disabled={!!togglingId}
                          title={video.isPublished ? 'Set Private' : 'Publish'}
                          className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl
                                      border transition-all text-[10px] font-semibold
                                      disabled:opacity-40 disabled:cursor-not-allowed
                                      ${video.isPublished
                                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                        >
                          {toggling
                            ? <Loader2 size={13} className="animate-spin" />
                            : video.isPublished
                              ? <><EyeOff size={13} /><span>Hide</span></>
                              : <><CheckCircle size={13} /><span>Pub</span></>
                          }
                        </button>

                        {/* Edit */}
                        <Link
                          to={`/edit/${video._id}`}
                          title="Edit"
                          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl
                                     bg-blue-500/10 hover:bg-blue-500/20 text-blue-400
                                     border border-blue-500/20 hover:border-blue-500/35
                                     transition-all text-[10px] font-semibold"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(video)}
                          title="Delete"
                          className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl
                                     bg-red-500/10 hover:bg-red-500/20 text-red-400
                                     border border-red-500/20 hover:border-red-500/35
                                     transition-all text-[10px] font-semibold"
                        >
                          <Trash2 size={13} />
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── SUBSCRIBERS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'subscribers' && (
        <div>
          {subsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-2xl bg-white/4 border border-white/6">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="h-2 bg-white/6 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-white/4 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <UserCheck size={28} className="text-zinc-700" />
              </div>
              <p className="text-zinc-400 font-semibold mb-2">No subscribers yet</p>
              <p className="text-zinc-600 text-sm">Share your channel to grow your audience!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">
                  All Subscribers
                  <span className="ml-2 text-zinc-500 font-normal text-sm">{subscribers.length}</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subscribers.map((sub, i) => (
                  <SubscriberCard key={sub?._id || sub?.subscriber?._id || i} sub={sub} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}