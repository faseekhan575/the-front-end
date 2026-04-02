// src/Playlists.jsx
import { useState } from 'react'
import { useGetUserPlaylistsQuery, useCreatePlaylistMutation } from './apiSlice'
import { useSelector } from 'react-redux'
import { Plus, Play, Edit3, X, Library } from 'lucide-react'
import { toast } from 'sonner'

export default function Playlists() {
  const currentUser = useSelector((state) => state.auth.user)
  const [showModal, setShowModal] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')

  const { data: playlistsData, isLoading, refetch } = useGetUserPlaylistsQuery(currentUser?._id)
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation()

  const playlists = playlistsData?.data || []

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!playlistName.trim()) { toast.error("Playlist name is required"); return }
    try {
      await createPlaylist({ name: playlistName, description: playlistDescription || "No description" }).unwrap()
      toast.success("Playlist created! 🎵")
      setShowModal(false)
      setPlaylistName('')
      setPlaylistDescription('')
      refetch()
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create playlist")
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-600/15 rounded-2xl flex items-center justify-center">
            <Library size={22} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Playlists</h1>
            <p className="text-zinc-400 text-sm">{playlists.length} playlists</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-900/20"
        >
          <Plus size={18} />
          New Playlist
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8">
              <div className="aspect-video bg-white/6"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/6 rounded-xl w-3/4"></div>
                <div className="h-3 bg-white/6 rounded-xl w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
          <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center mb-6">
            <Library size={36} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold mb-3">No playlists yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm mb-6">Create playlists to organize your favorite videos and share them with others.</p>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <Plus size={16} />
            Create First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group">
              <div className="aspect-video bg-zinc-900 flex items-center justify-center relative">
                <div className="w-16 h-16 bg-white/8 rounded-2xl flex items-center justify-center group-hover:bg-white/12 transition-colors">
                  <Play size={28} className="text-zinc-400 group-hover:text-white transition-colors ml-1" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2.5 py-1 rounded-lg font-medium">
                  {playlist.videos?.length || 0} videos
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm line-clamp-1 mb-1">{playlist.name}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{playlist.description || "No description"}</p>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/8 hover:bg-white/12 rounded-xl text-xs font-medium transition-colors border border-white/8">
                    <Play size={13} /> Play All
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/8 hover:bg-white/12 rounded-xl text-xs font-medium transition-colors border border-white/8">
                    <Edit3 size={13} /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-lg font-bold">New Playlist</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/8 hover:bg-white/12 rounded-xl flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Playlist Name</label>
                <input
                  type="text" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} required
                  placeholder="My Favorites"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
                <textarea
                  value={playlistDescription} onChange={(e) => setPlaylistDescription(e.target.value)}
                  rows={3} placeholder="What's this playlist about?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/12 rounded-xl text-sm font-medium hover:bg-white/6 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 rounded-xl text-sm font-semibold transition-colors">
                  {isCreating ? "Creating..." : "Create Playlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}