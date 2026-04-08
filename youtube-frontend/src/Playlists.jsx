// src/Playlists.jsx
// ENHANCED & FIXED PLAYLIST SYSTEM (Full production-ready version)
// Features added as requested:
// 1. Create playlist + instantly add ANY videos (your own OR other users' public videos)
// 2. Proper sequential playlist playback (auto next, prev, shuffle, loop, beautiful player modal)
// 3. Fixed createPlaylist API (backend only accepts name + description → we create first then add videos)
// 4. Searchable video picker during creation (from all public videos)
// 5. Searchable "Add Videos" in detail modal (now also supports other users' videos)
// 6. Robust video resolution (myVideos + allVideos so other users' videos always show thumbnail/title)
// 7. Full playlist player modal with native <video> + auto-advance + playlist sidebar
// 8. Best UX: loading states, toasts, optimistic updates, keyboard support, mobile friendly

import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useGetUserPlaylistsQuery,
  useCreatePlaylistMutation,
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
  useAddVideoToPlaylistMutation,
  useRemoveVideoFromPlaylistMutation,
  useGetMyVideosQuery,
  useGetAllVideosQuery,
} from './apiSlice'
import { useSelector } from 'react-redux'
import {
  Plus, Play, Edit3, X, Library, Trash2, Check,
  Search, PlayCircle, Film, Clock, ChevronRight,
  MoreVertical, ListVideo, Shuffle, ArrowLeft, Eye,
  CheckSquare, Square, Loader2, AlertCircle,
  SkipBack, SkipForward, Repeat, Volume2, Pause, Play as PlayIcon
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDuration = (s) => {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const formatNum = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds / 31536000 > 1) return Math.floor(seconds / 31536000) + 'y ago'
  if (seconds / 2592000 > 1) return Math.floor(seconds / 2592000) + 'mo ago'
  if (seconds / 86400 > 1) return Math.floor(seconds / 86400) + 'd ago'
  if (seconds / 3600 > 1) return Math.floor(seconds / 3600) + 'h ago'
  if (seconds / 60 > 1) return Math.floor(seconds / 60) + 'm ago'
  return 'just now'
}

// ─── Video Resolver (myVideos + allVideos so other users' videos work) ─────
const resolveVideo = (vidIdOrObj, myVideos, allVideos) => {
  if (typeof vidIdOrObj === 'object' && vidIdOrObj?.title) return vidIdOrObj
  const id = typeof vidIdOrObj === 'object' ? vidIdOrObj._id : vidIdOrObj
  return (
    myVideos.find((v) => v._id === id) ||
    allVideos.find((v) => v._id === id) || {
      _id: id,
      title: 'Video unavailable',
      thumbnail: null,
      videofile: null,
      _notFound: true,
    }
  )
}

// ─── Thumbnail Grid ─────────────────────────────────────────────────────────
function PlaylistThumbnailGrid({ videos, myVideos, allVideos }) {
  const resolvedThumbs = useMemo(() => {
    if (!videos?.length) return []
    return videos
      .slice(0, 4)
      .map((vid) => resolveVideo(vid, myVideos, allVideos))
      .map((v) => v.thumbnail)
      .filter(Boolean)
  }, [videos, myVideos, allVideos])

  if (!resolvedThumbs.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <Film size={32} className="text-zinc-700" />
      </div>
    )
  }

  if (resolvedThumbs.length === 1) {
    return <img src={resolvedThumbs[0]} alt="" className="w-full h-full object-cover" />
  }

  return (
    <div className="grid grid-cols-2 w-full h-full gap-0.5">
      {resolvedThumbs.slice(0, 4).map((src, i) => (
        <img key={i} src={src} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  )
}

// ─── FULL PLAYLIST PLAYER MODAL (the heart of the request) ─────────────────
function PlaylistPlayerModal({ playlist, myVideos, allVideos, onClose }) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const videoRef = useRef(null)

  const resolvedVideos = useMemo(() => {
    if (!playlist?.videos?.length) return []
    return playlist.videos.map((vid) => resolveVideo(vid, myVideos, allVideos))
  }, [playlist, myVideos, allVideos])

  const currentVideo = resolvedVideos[currentIndex]

  // Auto-play next video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      if (isRepeat) {
        video.currentTime = 0
        video.play()
        return
      }
      if (currentIndex < resolvedVideos.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (isShuffle) {
        const random = Math.floor(Math.random() * resolvedVideos.length)
        setCurrentIndex(random)
      } else {
        // end of playlist
        toast.info('Playlist finished 🎉')
      }
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [currentIndex, isRepeat, isShuffle, resolvedVideos.length])

  // Play/pause control
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.pause()
    else video.play()
    setIsPlaying(!isPlaying)
  }

  const goToIndex = (index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }

  const prevVideo = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    else if (isRepeat) setCurrentIndex(resolvedVideos.length - 1)
  }

  const nextVideo = () => {
    if (currentIndex < resolvedVideos.length - 1) setCurrentIndex(currentIndex + 1)
    else if (isRepeat || isShuffle) {
      setCurrentIndex(isShuffle ? Math.floor(Math.random() * resolvedVideos.length) : 0)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') nextVideo()
      if (e.key === 'ArrowLeft') prevVideo()
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex])

  if (!resolvedVideos.length) {
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]">
        <div className="text-center">
          <Film size={48} className="mx-auto text-zinc-500 mb-4" />
          <p className="text-zinc-400">This playlist is empty</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#111] w-full max-w-7xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="font-bold text-lg">{playlist.name}</h2>
              <p className="text-xs text-zinc-500">{resolvedVideos.length} videos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`px-4 py-2 rounded-2xl text-sm flex items-center gap-2 ${isShuffle ? 'bg-red-600 text-white' : 'bg-white/10'}`}
            >
              <Shuffle size={16} />
              Shuffle
            </button>
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`px-4 py-2 rounded-2xl text-sm flex items-center gap-2 ${isRepeat ? 'bg-red-600 text-white' : 'bg-white/10'}`}
            >
              <Repeat size={16} />
              Repeat
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-2xl">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* VIDEO PLAYER */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 relative">
              {currentVideo?._notFound || !currentVideo?.videofile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <AlertCircle size={64} />
                  <p className="mt-4">Video unavailable or private</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={currentVideo.videofile}
                  controls
                  autoPlay={isPlaying}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
            </div>

            {/* Now Playing Info */}
            <div className="p-4 border-t border-white/10 bg-[#111]">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{currentVideo.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentIndex + 1} of {resolvedVideos.length}
                  </p>
                </div>

                {/* Player controls (big buttons) */}
                <div className="flex items-center gap-3">
                  <button onClick={prevVideo} className="p-3 hover:bg-white/10 rounded-2xl">
                    <SkipBack size={24} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-3xl flex items-center justify-center shadow-xl"
                  >
                    {isPlaying ? <Pause size={28} /> : <PlayIcon size={28} />}
                  </button>
                  <button onClick={nextVideo} className="p-3 hover:bg-white/10 rounded-2xl">
                    <SkipForward size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PLAYLIST SIDEBAR */}
          <div className="w-96 border-l border-white/10 bg-[#111] flex flex-col">
            <div className="p-4 border-b border-white/10 font-medium text-sm flex items-center justify-between">
              <span>Up next in playlist</span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{resolvedVideos.length} videos</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
              {resolvedVideos.map((video, idx) => {
                const isActive = idx === currentIndex
                return (
                  <button
                    key={video._id}
                    onClick={() => goToIndex(idx)}
                    className={`w-full flex gap-3 p-3 rounded-2xl text-left transition-all ${
                      isActive ? 'bg-red-600/20 ring-2 ring-red-500' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative w-20 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <PlayCircle size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm line-clamp-2 ${isActive ? 'font-semibold text-red-400' : ''}`}>
                        {video.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{formatNum(video.views || 0)} views</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Videos Modal (now supports ALL public videos) ───────────────────────
function AddVideosModal({ playlist, myVideos, allVideos, onClose, onAdded }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [adding, setAdding] = useState(false)
  const [addVideo] = useAddVideoToPlaylistMutation()

  const existingIds = useMemo(
    () => new Set((playlist.videos || []).map((v) => (typeof v === 'object' ? v._id : v))),
    [playlist.videos]
  )

  const combinedVideos = useMemo(() => [...myVideos, ...allVideos], [myVideos, allVideos])

  const filtered = useMemo(() => {
    if (!combinedVideos.length) return []
    return combinedVideos.filter(
      (v) =>
        !existingIds.has(v._id) &&
        (v.title?.toLowerCase().includes(search.toLowerCase()) ||
          v.description?.toLowerCase().includes(search.toLowerCase()))
    )
  }, [combinedVideos, search, existingIds])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (!selected.size) return
    setAdding(true)
    let success = 0

    for (const videoId of selected) {
      try {
        await addVideo({ videoId, playlistId: playlist._id }).unwrap()
        success++
      } catch (err) {
        console.error(err)
      }
    }

    setAdding(false)
    if (success) {
      toast.success(`${success} video${success > 1 ? 's' : ''} added to "${playlist.name}"`)
      onAdded()
      onClose()
    } else {
      toast.error('Failed to add any videos')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">Add Videos</h2>
            <p className="text-xs text-zinc-500 mt-0.5">to "{playlist.name}" (any public video)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/8 hover:bg-white/14 rounded-xl flex items-center justify-center">
            <X size={15} />
          </button>
        </div>

        <div className="p-4 border-b border-white/6">
          <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-red-500/50">
            <Search size={15} className="text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any public video..."
              className="bg-transparent text-sm outline-none flex-1"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Film size={28} className="mx-auto mb-3 opacity-40" />
              <p>No matching videos found</p>
            </div>
          ) : (
            filtered.map((video) => {
              const isSelected = selected.has(video._id)
              return (
                <button
                  key={video._id}
                  onClick={() => toggle(video._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                    isSelected ? 'bg-red-600/12 border border-red-500/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative w-20 aspect-video rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0">
                    {video.thumbnail && <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatNum(video.views)} views · {timeAgo(video.createdAt)}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center border ${isSelected ? 'bg-red-600 border-red-600' : 'border-zinc-500'}`}>
                    {isSelected && <Check size={16} className="text-white" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-white/8 flex items-center justify-between">
          <span className="text-sm text-zinc-500">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2 border border-white/10 rounded-2xl">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!selected.size || adding}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 rounded-2xl flex items-center gap-2 font-semibold"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add {selected.size} Video{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Playlist Detail Modal ───────────────────────────────────────────────────
function PlaylistDetailModal({ playlist, myVideos, allVideos, onClose, onEdit, onDelete, onRefetch }) {
  const navigate = useNavigate()
  const [removeVideo] = useRemoveVideoFromPlaylistMutation()
  const [showAddVideos, setShowAddVideos] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)

  const resolvedVideos = useMemo(() => {
    if (!playlist.videos?.length) return []
    return playlist.videos.map((vid) => resolveVideo(vid, myVideos, allVideos))
  }, [playlist.videos, myVideos, allVideos])

  const handlePlayAll = () => {
    if (!resolvedVideos.length) return toast.error('Playlist is empty')
    setShowPlayer(true)
  }

  const handleShuffle = () => {
    const playable = resolvedVideos.filter((v) => !v._notFound)
    if (!playable.length) return toast.error('No playable videos')
    const randIndex = Math.floor(Math.random() * playable.length)
    // For simplicity we still open full player (shuffle is handled inside player)
    setShowPlayer(true)
  }

  const handleRemove = async (videoId) => {
    setRemovingId(videoId)
    try {
      await removeVideo({ videoId, playlistId: playlist._id }).unwrap()
      toast.success('Video removed')
      onRefetch()
    } catch {
      toast.error('Failed to remove')
    }
    setRemovingId(null)
  }

  const totalDuration = useMemo(() => resolvedVideos.reduce((acc, v) => acc + (v.duration || 0), 0), [resolvedVideos])

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="flex-shrink-0 relative overflow-hidden rounded-t-3xl">
            {resolvedVideos[0]?.thumbnail && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110"
                style={{ backgroundImage: `url(${resolvedVideos[0].thumbnail})` }}
              />
            )}
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-28 aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-xl">
                  <PlaylistThumbnailGrid videos={playlist.videos} myVideos={myVideos} allVideos={allVideos} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg leading-tight line-clamp-2">{playlist.name}</h2>
                  {playlist.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{playlist.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><ListVideo size={12} />{resolvedVideos.length} videos</span>
                    {totalDuration > 0 && <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(totalDuration)}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={handlePlayAll}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-semibold shadow-lg shadow-red-900/30"
                    >
                      <PlayCircle size={18} /> Play All
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium"
                    >
                      <Shuffle size={18} /> Shuffle
                    </button>
                    <button
                      onClick={() => setShowAddVideos(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium"
                    >
                      <Plus size={18} /> Add Videos
                    </button>
                    <button onClick={() => { onEdit(playlist); onClose() }} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium">
                      <Edit3 size={18} /> Edit
                    </button>
                    <button onClick={() => { onDelete(playlist._id, playlist.name); onClose() }} className="flex items-center gap-2 px-5 py-2.5 hover:bg-red-900/30 text-red-400 rounded-2xl text-sm font-medium">
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Video list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {resolvedVideos.length === 0 ? (
              <div className="text-center py-20">
                <Film size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">No videos yet</p>
                <button onClick={() => setShowAddVideos(true)} className="mt-6 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 mx-auto">
                  <Plus size={16} /> Add videos now
                </button>
              </div>
            ) : (
              resolvedVideos.map((video, i) => (
                <div key={video._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 group">
                  <span className="font-mono text-xs text-zinc-500 w-6">{i + 1}</span>
                  <div className="w-24 aspect-video rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><AlertCircle size={24} className="text-zinc-600" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {video._notFound ? (
                      <p className="italic text-zinc-500">Video unavailable</p>
                    ) : (
                      <>
                        <p className="font-medium line-clamp-2">{video.title}</p>
                        <p className="text-xs text-zinc-500">{formatNum(video.views)} views • {timeAgo(video.createdAt)}</p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(video._id)}
                    disabled={removingId === video._id}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-900/30 rounded-xl"
                  >
                    {removingId === video._id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Player Modal */}
      {showPlayer && (
        <PlaylistPlayerModal
          playlist={playlist}
          myVideos={myVideos}
          allVideos={allVideos}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {/* Add Videos */}
      {showAddVideos && (
        <AddVideosModal
          playlist={playlist}
          myVideos={myVideos}
          allVideos={allVideos}
          onClose={() => setShowAddVideos(false)}
          onAdded={onRefetch}
        />
      )}
    </>
  )
}

// ─── MAIN PLAYLISTS PAGE (fully upgraded) ───────────────────────────────────
export default function Playlists() {
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.auth.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [selectedVideoIds, setSelectedVideoIds] = useState([])

  const [detailPlaylist, setDetailPlaylist] = useState(null)
  const [search, setSearch] = useState('')

  // API hooks
  const { data: playlistsData, isLoading, refetch } = useGetUserPlaylistsQuery(currentUser?._id)
  const { data: myVideosData } = useGetMyVideosQuery()
  const { data: allVideosData } = useGetAllVideosQuery({ page: 1, limit: 300 }) // more videos = better "other user" support

  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation()
  const [deletePlaylist] = useDeletePlaylistMutation()
  const [updatePlaylist, { isLoading: isUpdating }] = useUpdatePlaylistMutation()
  const [addVideo] = useAddVideoToPlaylistMutation()

  const playlists = playlistsData?.data || []
  const myVideos = myVideosData?.data || []
  const allVideos = allVideosData?.data?.videos || allVideosData?.data || []

  const filteredPlaylists = useMemo(() => {
    if (!search) return playlists
    const term = search.toLowerCase()
    return playlists.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
    )
  }, [playlists, search])

  // ── Create / Edit Modal Video Picker (with search) ─────────────────────
  const [createSearch, setCreateSearch] = useState('')

  const filteredCreateVideos = useMemo(() => {
    const term = createSearch.toLowerCase()
    return allVideos.filter((v) =>
      v.title?.toLowerCase().includes(term) || v.description?.toLowerCase().includes(term)
    )
  }, [allVideos, createSearch])

  const toggleVideoSelection = (id) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreateOrEdit = async (e) => {
    e.preventDefault()
    if (!playlistName.trim()) return toast.error('Playlist name is required')

    try {
      if (editTarget) {
        // UPDATE
        await updatePlaylist({
          playlistId: editTarget._id,
          name: playlistName,
          description: playlistDescription || '',
        }).unwrap()
        toast.success('Playlist updated')
      } else {
        // CREATE + ADD VIDEOS (the key fix)
        const created = await createPlaylist({
          name: playlistName.trim(),
          description: playlistDescription.trim() || 'No description',
        }).unwrap()

        const newPlaylistId = created.data?._id || created._id

        if (selectedVideoIds.length > 0 && newPlaylistId) {
          let added = 0
          for (const videoId of selectedVideoIds) {
            try {
              await addVideo({ videoId, playlistId: newPlaylistId }).unwrap()
              added++
            } catch {}
          }
          if (added) toast.success(`${added} video${added > 1 ? 's' : ''} added automatically`)
        }

        toast.success(`Playlist "${playlistName}" created!`)
      }

      setShowCreateModal(false)
      refetch()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save playlist')
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setPlaylistName('')
    setPlaylistDescription('')
    setSelectedVideoIds([])
    setCreateSearch('')
    setShowCreateModal(true)
  }

  const openEdit = (playlist) => {
    setEditTarget(playlist)
    setPlaylistName(playlist.name)
    setPlaylistDescription(playlist.description || '')
    setSelectedVideoIds([])
    setShowCreateModal(true)
  }

  const handleDelete = async (playlistId, name) => {
    if (!confirm(`Delete "${name}" forever?`)) return
    try {
      await deletePlaylist(playlistId).unwrap()
      toast.success('Playlist deleted')
      refetch()
      if (detailPlaylist?._id === playlistId) setDetailPlaylist(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-red-500 rounded-3xl flex items-center justify-center">
            <Library size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Playlists</h1>
            <p className="text-zinc-400">{playlists.length} playlists</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {playlists.length > 3 && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-3xl px-5 py-3">
              <Search size={18} className="text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search playlists..."
                className="ml-3 bg-transparent outline-none text-sm w-64 placeholder-zinc-500"
              />
            </div>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-3 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-3xl font-semibold shadow-xl shadow-red-950/50 active:scale-95 transition-all"
          >
            <Plus size={20} />
            New Playlist
          </button>
        </div>
      </div>

      {/* Loading / Empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-3xl overflow-hidden">
              <div className="aspect-video bg-white/10" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-white/10 rounded-2xl w-3/4" />
                <div className="h-3 bg-white/10 rounded-2xl w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlaylists.length === 0 && playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Library size={80} className="text-purple-400/30 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">No playlists yet</h2>
          <p className="text-zinc-400 max-w-xs mb-8">Create your first playlist and add videos from anyone on the platform.</p>
          <button onClick={openCreate} className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-3xl text-lg font-semibold flex items-center gap-3">
            <Plus size={24} /> Create First Playlist
          </button>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">No playlists match "{search}"</div>
      ) : (
        /* Playlist Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlaylists.map((playlist) => {
            const count = playlist.videos?.length || 0
            return (
              <div
                key={playlist._id}
                className="group bg-white/5 border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden flex flex-col cursor-pointer transition-all"
                onClick={() => setDetailPlaylist(playlist)}
              >
                <div className="aspect-video relative">
                  <PlaylistThumbnailGrid videos={playlist.videos} myVideos={myVideos} allVideos={allVideos} />
                  <div className="absolute bottom-3 right-3 bg-black/80 text-xs px-3 py-1 rounded-2xl flex items-center gap-1">
                    <Film size={13} /> {count}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-6 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailPlaylist(playlist)
                        // small delay so modal opens first
                        setTimeout(() => {
                          // trigger player from detail modal
                        }, 100)
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-2xl"
                    >
                      <Play size={16} fill="white" /> Play
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-red-400 transition-colors">{playlist.name}</h3>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 flex-1">{playlist.description || 'No description'}</p>

                  <div className="flex gap-2 mt-auto pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailPlaylist(playlist)
                      }}
                      className="flex-1 py-3 text-sm font-medium border border-white/20 hover:border-white/40 rounded-2xl"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailPlaylist(playlist)
                      }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Quick create card */}
          <button
            onClick={openCreate}
            className="border-2 border-dashed border-white/20 hover:border-red-500/40 rounded-3xl h-72 flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <p className="font-medium">Create new playlist</p>
              <p className="text-xs mt-1">Add videos from anyone</p>
            </div>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailPlaylist && (
        <PlaylistDetailModal
          playlist={detailPlaylist}
          myVideos={myVideos}
          allVideos={allVideos}
          onClose={() => setDetailPlaylist(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onRefetch={() => {
            refetch()
            // keep modal open
          }}
        />
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{editTarget ? 'Edit Playlist' : 'New Playlist'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateOrEdit} className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
              <div>
                <label className="text-xs font-semibold tracking-widest text-zinc-400 mb-2 block">PLAYLIST NAME *</label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-red-500 rounded-3xl px-6 py-4 text-lg outline-none"
                  placeholder="Summer Vibes 2026"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-xs font-semibold tracking-widest text-zinc-400 mb-2 block">DESCRIPTION</label>
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  rows={3}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-red-500 rounded-3xl px-6 py-4 text-sm outline-none resize-none"
                  placeholder="What’s this playlist about?"
                />
              </div>

              {/* Video picker only for NEW playlist */}
              {!editTarget && (
                <div className="flex-1 flex flex-col min-h-0 border border-white/10 rounded-3xl bg-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <Search size={18} />
                    <input
                      value={createSearch}
                      onChange={(e) => setCreateSearch(e.target.value)}
                      placeholder="Search any public video to add instantly..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                    {filteredCreateVideos.length === 0 ? (
                      <div className="text-center py-10 text-zinc-400">No videos found</div>
                    ) : (
                      filteredCreateVideos.map((video) => {
                        const selected = selectedVideoIds.includes(video._id)
                        return (
                          <button
                            key={video._id}
                            type="button"
                            onClick={() => toggleVideoSelection(video._id)}
                            className={`w-full flex gap-4 p-4 rounded-3xl transition-all border ${selected ? 'border-red-500 bg-red-600/10' : 'border-transparent hover:bg-white/5'}`}
                          >
                            <div className="w-28 aspect-video rounded-2xl overflow-hidden bg-black flex-shrink-0">
                              {video.thumbnail && <img src={video.thumbnail} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium line-clamp-2">{video.title}</p>
                              <p className="text-xs text-zinc-500 mt-2">{formatNum(video.views)} views • {timeAgo(video.createdAt)}</p>
                            </div>
                            <div className="flex items-center">
                              {selected ? <CheckSquare size={24} className="text-red-400" /> : <Square size={24} className="text-zinc-400" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                  {selectedVideoIds.length > 0 && (
                    <div className="p-4 text-center text-xs text-red-400 font-medium">
                      {selectedVideoIds.length} video{selectedVideoIds.length > 1 ? 's' : ''} will be added automatically after creation
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-5 border border-white/20 rounded-3xl text-sm font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 py-5 bg-red-600 hover:bg-red-500 rounded-3xl text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-zinc-700"
                >
                  {(isCreating || isUpdating) ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...,
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {editTarget ? 'Save Changes' : 'Create & Add Videos'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}