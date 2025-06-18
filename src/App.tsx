import { useState, useEffect } from "react"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/components/Dashboard"
import { Settings } from "@/components/Settings"
import { Login } from "@/components/Login"
import { initializeMockData } from "@/lib/mockData"

function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on app load
    console.log('App useEffect: checking auth status')
    checkAuthStatus()
    // Initialize mock data on first load
    initializeMockData()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      })
      console.log('Auth check response:', response.status)
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      console.log('Auth check complete, isLoading set to false')
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuthenticated(false)
    }
  }

  if (isLoading) {
    console.log('App is loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing Login form')
    return <Login onLogin={handleLogin} />
  }

  console.log('User authenticated, showing app')

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "settings" && <Settings />}
    </Layout>
  )
}

export default App
