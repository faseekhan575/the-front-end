// src/Channel.jsx
import { useParams, Link } from 'react-router-dom'
import { useGetChannelProfileQuery, useToggleSubscriptionMutation, useGetAllVideosQuery } from './apiSlice'
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Users, Eye, PlayCircle, Grid3X3, List, CheckCircle2 } from 'lucide-react'

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
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

const TABS = ['Home', 'Videos', 'Playlists', 'About']

export default function Channel() {
  const { username } = useParams()
  const currentUser = useSelector((state) => state.auth.user)

  const { data: channelData, isLoading } = useGetChannelProfileQuery(username)
  const { data: videosData } = useGetAllVideosQuery({ page: 1, limit: 20, userId: '' })
  const [toggleSub] = useToggleSubscriptionMutation()

  const channel = channelData?.data
  const videos = videosData?.data || []
  const isOwnChannel = currentUser?.username === username

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [activeTab, setActiveTab] = useState('Videos')
  const [viewMode, setViewMode] = useState('grid')

  const handleSubscribe = async () => {
    if (!channel?._id) return
    if (!currentUser) { toast.error("Please sign in to subscribe"); return }
    try {
      await toggleSub(channel._id).unwrap()
      setIsSubscribed(!isSubscribed)
      toast.success(isSubscribed ? "Unsubscribed" : "Subscribed! 🔔")
    } catch {
      toast.error("Failed to toggle subscription")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-48 md:h-64 bg-white/6 rounded-3xl mb-0"></div>
        <div className="px-6 -mt-12 flex gap-5 items-end mb-8">
          <div className="w-28 h-28 rounded-2xl bg-white/8 border-4 border-[#0a0a0a]"></div>
          <div className="pb-2 flex-1 space-y-2">
            <div className="h-5 bg-white/6 rounded-xl w-48"></div>
            <div className="h-3 bg-white/6 rounded-xl w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="text-center py-32">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-xl font-semibold">Channel not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cover */}
      <div className="h-44 md:h-60 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl overflow-hidden relative">
        {channel.coverImages ? (
          <img src={channel.coverImages} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-zinc-900 to-zinc-900" />
        )}
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Channel Info */}
      <div className="px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 relative">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-[#0a0a0a] bg-zinc-800 shadow-2xl">
              <img src={channel.avatar} alt={channel.username} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{channel.fullname}</h1>
                <CheckCircle2 size={20} className="text-blue-400 flex-shrink-0" />
              </div>
              <p className="text-zinc-400 text-sm mb-2">@{channel.username}</p>
              <div className="flex items-center gap-5 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Users size={15} />
                  <span><span className="text-white font-semibold">{formatNum(channel.subcriberscount)}</span> subscribers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PlayCircle size={15} />
                  <span><span className="text-white font-semibold">{formatNum(channel.channelSubcribedtocount)}</span> subscribed</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            {!isOwnChannel ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubscribe}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isSubscribed
                      ? 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/15'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                  }`}
                >
                  {isSubscribed ? <><Bell size={16} /> Subscribed</> : 'Subscribe'}
                </button>
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-semibold border border-white/15 transition-all"
              >
                Manage Channel
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-white/8 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === 'Videos' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{videos.length > 0 ? `${videos.length} Videos` : 'Videos'}</h2>
                <div className="flex items-center gap-1 bg-white/6 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {videos.map((video) => (
                    <Link to={`/watch/${video._id}`} key={video._id} className="group">
                      <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-3">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded-lg font-semibold">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2 mb-1 group-hover:text-red-400 transition-colors">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Eye size={12} />
                        <span>{formatNum(video.views)} views</span>
                        <span>•</span>
                        <span>{timeAgo(video.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <Link to={`/watch/${video._id}`} key={video._id} className="group flex gap-4 p-3 rounded-2xl hover:bg-white/4 transition-colors">
                      <div className="relative w-44 flex-shrink-0 aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs px-1.5 py-0.5 rounded font-semibold">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">{video.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Eye size={12} />
                          <span>{formatNum(video.views)} views</span>
                          <span>•</span>
                          <span>{timeAgo(video.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{video.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {videos.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                  <PlayCircle size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-400 font-medium">No videos yet</p>
                  {isOwnChannel && (
                    <Link to="/upload" className="mt-4 inline-block bg-red-600 hover:bg-red-500 px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
                      Upload Your First Video
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Home' && (
            <div className="text-center py-20 text-zinc-500">
              <div className="text-4xl mb-3">🏠</div>
              Channel home content coming soon
            </div>
          )}

          {activeTab === 'Playlists' && (
            <div className="text-center py-20 text-zinc-500">
              <div className="text-4xl mb-3">📋</div>
              Playlists will appear here
            </div>
          )}

          {activeTab === 'About' && (
            <div className="max-w-2xl py-6">
              <h3 className="text-lg font-bold mb-4">About this channel</h3>
              <div className="space-y-4">
                <div className="bg-white/4 rounded-2xl p-5 border border-white/8">
                  <div className="flex items-center gap-3 mb-3">
                    <Users size={18} className="text-zinc-400" />
                    <span className="text-sm text-zinc-300">{formatNum(channel.subcriberscount)} subscribers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlayCircle size={18} className="text-zinc-400" />
                    <span className="text-sm text-zinc-300">Subscribed to {formatNum(channel.channelSubcribedtocount)} channels</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}