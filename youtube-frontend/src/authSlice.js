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
      localStorage.setItem('accessToken', action.payload.accessToken)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    },
    loadUserFromStorage: (state) => {
      const token = localStorage.getItem('accessToken')
      const user = localStorage.getItem('user')
      if (token && user) {
        state.accessToken = token
        state.user = JSON.parse(user)
        state.isAuthenticated = true
      }
    }
  },
})

export const { setCredentials, setUser, logout, loadUserFromStorage } = authSlice.actions
export default authSlice.reducer  // ✅ FIX: was authSlice.reducery (typo)