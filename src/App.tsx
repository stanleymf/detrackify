import { useState, useEffect } from "react"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/components/Dashboard"
import { Settings } from "@/components/Settings"
import { Login } from "@/components/Login"
import { initializeMockData } from "@/lib/mockData"
import Analytics from "@/components/Analytics"
import Info from "@/components/Info"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "analytics" | "info">("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto')

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
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onLogout={handleLogout}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      {/* Navigation Tabs - right-aligned, above dashboard content */}
      <div className="flex justify-end mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void}>
          <TabsList className="bg-dust-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-olive-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-olive-600 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-olive-600 data-[state=active]:text-white">
              Info
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-olive-600 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "dashboard" && <Dashboard viewMode={viewMode} onViewModeChange={setViewMode} />}
      {activeTab === "settings" && <Settings viewMode={viewMode} onViewModeChange={setViewMode} />}
      {activeTab === "analytics" && <Analytics viewMode={viewMode} onViewModeChange={setViewMode} />}
      {activeTab === "info" && <Info viewMode={viewMode} onViewModeChange={setViewMode} />}
    </Layout>
  )
}

export default App
