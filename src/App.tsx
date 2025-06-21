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
import { useIsMobile } from "@/components/hooks/use-mobile"

function NavigationTabs() {
  const location = useLocation()
  const isMobile = useIsMobile()
  
  // Map path to tab value
  const pathToTab: Record<string, string> = {
    "/dashboard": "dashboard",
    "/analytics": "analytics",
    "/info": "info",
    "/settings": "settings"
  }
  const tab = pathToTab[location.pathname] || "dashboard"
  
  return (
    <div className="mb-4 md:mb-6 px-2 md:px-0">
      <Tabs value={tab} className="w-full">
        <TabsList className={`
          bg-dust-200 gap-x-1 md:gap-x-2 lg:gap-x-8 
          rounded-2xl shadow-sm px-1 md:px-2 py-1
          w-full max-w-full overflow-hidden
          ${isMobile ? 'flex-row justify-between' : 'flex justify-center'}
        `}>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) =>
              `flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-2 
               rounded-full transition-all duration-200 text-sm md:text-base font-medium
               text-center whitespace-nowrap
               ${isActive ?
                 'bg-olive-600 text-white font-bold shadow-lg transform scale-105' :
                 'text-olive-700 hover:bg-olive-100 hover:text-olive-900 active:scale-95'
               }
               ${isMobile ? 'min-w-0 flex-shrink-0' : ''}
              `
            }
            aria-label="Dashboard - View orders and main overview"
          >
            {isMobile ? '📊' : 'Dashboard'}
          </NavLink>
          <NavLink 
            to="/analytics" 
            className={({ isActive }) =>
              `flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-2 
               rounded-full transition-all duration-200 text-sm md:text-base font-medium
               text-center whitespace-nowrap
               ${isActive ?
                 'bg-olive-600 text-white font-bold shadow-lg transform scale-105' :
                 'text-olive-700 hover:bg-olive-100 hover:text-olive-900 active:scale-95'
               }
               ${isMobile ? 'min-w-0 flex-shrink-0' : ''}
              `
            }
            aria-label="Analytics - View reports and performance data"
          >
            {isMobile ? '📈' : 'Analytics'}
          </NavLink>
          <NavLink 
            to="/info" 
            className={({ isActive }) =>
              `flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-2 
               rounded-full transition-all duration-200 text-sm md:text-base font-medium
               text-center whitespace-nowrap
               ${isActive ?
                 'bg-olive-600 text-white font-bold shadow-lg transform scale-105' :
                 'text-olive-700 hover:bg-olive-100 hover:text-olive-900 active:scale-95'
               }
               ${isMobile ? 'min-w-0 flex-shrink-0' : ''}
              `
            }
            aria-label="Info - Store information and configuration"
          >
            {isMobile ? 'ℹ️' : 'Info'}
          </NavLink>
          <NavLink 
            to="/settings" 
            className={({ isActive }) =>
              `flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-2 
               rounded-full transition-all duration-200 text-sm md:text-base font-medium
               text-center whitespace-nowrap
               ${isActive ?
                 'bg-olive-600 text-white font-bold shadow-lg transform scale-105' :
                 'text-olive-700 hover:bg-olive-100 hover:text-olive-900 active:scale-95'
               }
               ${isMobile ? 'min-w-0 flex-shrink-0' : ''}
              `
            }
            aria-label="Settings - App configuration and preferences"
          >
            {isMobile ? '⚙️' : 'Settings'}
          </NavLink>
        </TabsList>
      </Tabs>
    </div>
  )
}

function AppRoutes({ viewMode, setViewMode }: { viewMode: 'auto' | 'mobile' | 'desktop', setViewMode: (mode: 'auto' | 'mobile' | 'desktop') => void }) {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard viewMode={viewMode} />} />
      <Route path="/settings" element={<Settings viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/analytics" element={<Analytics viewMode={viewMode} onViewModeChange={setViewMode} />} />
      <Route path="/info" element={<Info viewMode={viewMode} />} />
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
      const data = await response.json()
      
      if (response.ok && data.authenticated) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        // Clear any stale authentication state
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      // Clear any stale authentication state
      localStorage.removeItem('auth_token')
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
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      // Clear any cached authentication data
      localStorage.removeItem('auth_token')
      // Force a page reload to clear any cached state
      window.location.href = '/'
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
