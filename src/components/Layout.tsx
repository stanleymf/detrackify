import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/components/hooks/use-mobile"

interface LayoutProps {
  children: React.ReactNode
  activeTab: "dashboard" | "settings" | "analytics" | "info"
  onTabChange: (tab: "dashboard" | "settings" | "analytics" | "info") => void
  onLogout: () => void
}

export function Layout({ children, activeTab, onTabChange, onLogout }: LayoutProps) {
  const isMobile = useIsMobile()
  
  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-dust-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center ${isMobile ? 'h-14' : 'h-16'}`}>
            <div className="flex items-center">
              <h1 className={`font-bold text-olive-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Detrackify</h1>
            </div>

            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              <Tabs value={activeTab} onValueChange={onTabChange as (value: string) => void}>
                <TabsList className={`bg-dust-200 ${isMobile ? 'scale-90' : ''}`}>
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    {isMobile ? 'Dash' : 'Dashboard'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button 
                variant="outline" 
                onClick={onLogout}
                className={`text-gray-600 hover:text-gray-800 ${isMobile ? 'text-xs px-2 py-1' : ''}`}
              >
                {isMobile ? 'Logout' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'py-4' : ''}`}>{children}</main>
    </div>
  )
}
