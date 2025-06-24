import React from 'react'
import SocialPostingInterface from './components/SocialPostingInterface'
import { useApiService } from './services/api'

function App() {
  // Initialize API service with Auth0
  useApiService();
  
  return <SocialPostingInterface />
}

export default App