import { useState, useEffect } from "react"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/components/Dashboard"
import { Settings } from "@/components/Settings"
import { Login } from "@/components/Login"
import { initializeMockData } from "@/lib/mockData"
import Analytics from "@/components/Analytics"
import Info from "@/components/Info"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { BrowserRouter, Routes, Route, Navigate, useLocation, NavLink } from "react-router-dom"

function NavigationTabs() {
  const location = useLocation()
  // Map path to tab value
  const pathToTab: Record<string, string> = {
    "/dashboard": "dashboard",
    "/analytics": "analytics",
    "/info": "info",
    "/settings": "settings"
  }
  const tab = pathToTab[location.pathname] || "dashboard"
  return (
    <div className="mb-6 flex justify-end md:justify-center">
      <Tabs value={tab}>
        <TabsList className="bg-dust-200 gap-x-2 md:gap-x-8">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "data-[state=active]:bg-olive-600 data-[state=active]:text-white px-4 py-2 rounded" : "px-4 py-2 rounded"}>
            Dashboard
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "data-[state=active]:bg-olive-600 data-[state=active]:text-white px-4 py-2 rounded" : "px-4 py-2 rounded"}>
            Analytics
          </NavLink>
          <NavLink to="/info" className={({ isActive }) => isActive ? "data-[state=active]:bg-olive-600 data-[state=active]:text-white px-4 py-2 rounded" : "px-4 py-2 rounded"}>
            Info
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "data-[state=active]:bg-olive-600 data-[state=active]:text-white px-4 py-2 rounded" : "px-4 py-2 rounded"}>
            Settings
          </NavLink>
        </TabsList>
      </Tabs>
    </div>
  )
}

function AppRoutes({ viewMode, setViewMode }: { viewMode: any, setViewMode: any }) {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/settings" element={<Settings viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/analytics" element={<Analytics viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/info" element={<Info viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto')

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus()
    // Initialize mock data on first load
    initializeMockData()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      })
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
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
    } finally {
      setIsAuthenticated(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Layout 
        activeTab="dashboard" // Not used anymore
        onTabChange={() => {}} // Not used anymore
        onLogout={handleLogout}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        <NavigationTabs />
        <AppRoutes viewMode={viewMode} setViewMode={setViewMode} />
      </Layout>
    </BrowserRouter>
  )
}

export default App
