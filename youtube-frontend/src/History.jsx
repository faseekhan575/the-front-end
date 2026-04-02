// src/History.jsx
import { Link } from 'react-router-dom'
import { Clock, ArrowRight } from 'lucide-react'

export default function History() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 bg-amber-600/15 rounded-2xl flex items-center justify-center">
          <Clock size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Watch History</h1>
          <p className="text-zinc-400 text-sm">Videos you've watched recently</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
        <div className="w-20 h-20 bg-amber-600/10 rounded-3xl flex items-center justify-center mb-6">
          <Clock size={36} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold mb-3">Your watch history is empty</h2>
        <p className="text-zinc-400 text-sm max-w-sm mb-6">
          Videos you watch on FaseehVision will appear here so you can pick up right where you left off.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          Browse Videos
          <ArrowRight size={16} />
        </Link>
      </div>

      <p className="text-center text-xs text-zinc-600 mt-8">
        Watch history endpoint available in backend — ready to connect in next iteration.
      </p>
    </div>
  )
}