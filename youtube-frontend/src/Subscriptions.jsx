// src/Subscriptions.jsx
import { useGetSubscribedChannelsQuery } from './apiSlice'
import { Link } from 'react-router-dom'
import { Users, UserCheck, ArrowRight } from 'lucide-react'

export default function Subscriptions() {
  const { data: subscribedData, isLoading, isError } = useGetSubscribedChannelsQuery()

  // Backend now returns: [{ subscriber, channel: { _id, username, fullname, avatar } }]
  const subscribedChannels = subscribedData?.data || []

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-white/6 rounded-xl w-48 mb-8"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/4 rounded-2xl p-5 border border-white/8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/8"></div>
              <div className="h-4 bg-white/8 rounded-xl w-24"></div>
              <div className="h-3 bg-white/6 rounded-xl w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || subscribedChannels.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 bg-blue-600/15 rounded-2xl flex items-center justify-center">
            <Users size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-zinc-400 text-sm">Channels you follow</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/2 text-center">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6">
            <Users size={36} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-3">No subscriptions yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm mb-6">Subscribe to channels you love to get their latest videos here.</p>
          <Link to="/" className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Discover Channels <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-blue-600/15 rounded-2xl flex items-center justify-center">
          <Users size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-zinc-400 text-sm">{subscribedChannels.length} channels</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {subscribedChannels.map((sub) => {
          const channel = sub.channel
          if (!channel?._id) return null
          return (
            <Link
              to={`/channel/${channel.username}`}
              key={channel._id}
              className="group bg-white/4 border border-white/8 hover:border-red-500/30 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:bg-white/6"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-red-500/40 transition-all mb-4 group-hover:scale-105 duration-300">
                <img src={channel.avatar} alt={channel.username} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/default-avatar.png' }} />
              </div>
              <p className="font-bold text-sm line-clamp-1 group-hover:text-red-400 transition-colors mb-0.5">{channel.fullname}</p>
              <p className="text-xs text-zinc-500 mb-3">@{channel.username}</p>
              <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                <UserCheck size={12} /> Subscribed
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}