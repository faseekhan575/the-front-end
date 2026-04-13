// src/authSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      // ✅ always save user to localStorage for refresh rehydration
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      // ✅ only save real tokens, not null or cookie-based string
      if (
        action.payload.accessToken &&
        action.payload.accessToken !== 'null' &&
        action.payload.accessToken !== 'cookie-based'
      ) {
        localStorage.setItem('accessToken', action.payload.accessToken)
      }
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    },
    loadUserFromStorage: (state) => {
      try {
        const userStr = localStorage.getItem('user')
        const token = localStorage.getItem('accessToken')

        if (userStr && userStr !== 'null' && userStr !== 'undefined') {
          const user = JSON.parse(userStr)
          if (user && user._id) {
            state.user = user
            state.isAuthenticated = true
            // ✅ restore token if real, otherwise null (cookie handles API calls)
            state.accessToken = (token && token !== 'null' && token !== 'cookie-based')
              ? token
              : null
          }
        }
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      }
    },
  },
})

export const { setCredentials, setUser, logout, loadUserFromStorage } = authSlice.actions
export default authSlice.reducer