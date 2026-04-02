// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'

// Layouts & Pages
import RootLayout from './RootLayout'
import Home from './Home'
import Login from './Login'
import Register from './Register'
import WatchVideo from './WatchVideo'
import Channel from './Channel'
import UploadVideo from './UploadVideo'
import Dashboard from './Dashboard'
import Playlists from './Playlists'
import LikedVideos from './LikedVideos'
import History from './History'
import Subscriptions from './Subscriptions'
import SearchResults from './SearchResults'
import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'watch/:videoId', element: <WatchVideo /> },
      { path: 'channel/:username', element: <Channel /> },
      {
        path: 'upload',
        element: <ProtectedRoute><UploadVideo /></ProtectedRoute>
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: 'playlists',
        element: <ProtectedRoute><Playlists /></ProtectedRoute>
      },
      {
        path: 'liked',
        element: <ProtectedRoute><LikedVideos /></ProtectedRoute>
      },
      {
        path: 'history',
        element: <ProtectedRoute><History /></ProtectedRoute>
      },
      {
        path: 'subscriptions',
        element: <ProtectedRoute><Subscriptions /></ProtectedRoute>
      },
      { path: 'search', element: <SearchResults /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
)