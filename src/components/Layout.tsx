import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/components/hooks/use-mobile"
import { Smartphone, Monitor } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  activeTab: "dashboard" | "settings" | "analytics" | "info"
  onTabChange: (tab: "dashboard" | "settings" | "analytics" | "info") => void
  onLogout: () => void
  // View mode props for Dashboard
  viewMode?: 'auto' | 'mobile' | 'desktop'
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void
  showViewModeToggles?: boolean
}

export function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout, 
  viewMode = 'auto',
  onViewModeChange,
  showViewModeToggles = true
}: LayoutProps) {
  const isMobile = useIsMobile()
  
  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-dust-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col gap-2 py-2 ${isMobile ? '' : 'h-16'}`}>
            {/* Top Row - Logo and View Mode */}
            <div className="flex items-center justify-between">
              <h1 className={`font-bold text-olive-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Detrackify</h1>
              <div className="flex items-center gap-2">
                {/* View Mode Toggles */}
                {onViewModeChange && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === 'auto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('auto')}
                      className="text-xs px-2"
                      title="Auto (responsive)"
                    >
                      Auto
                    </Button>
                    <Button
                      variant={viewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('mobile')}
                      className="text-xs px-2"
                      title="Mobile card view"
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('desktop')}
                      className="text-xs px-2"
                      title="Desktop table view"
                    >
                      <Monitor className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  onClick={onLogout}
                  className={`text-gray-600 hover:text-gray-800 text-xs px-2 py-1`}
                >
                  {isMobile ? 'Out' : 'Logout'}
                </Button>
              </div>
            </div>

            {/* Bottom Row - Navigation only */}
            <div className="flex items-center justify-end">
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
                    {isMobile ? 'Ana' : 'Analytics'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    {isMobile ? 'Info' : 'Info'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    {isMobile ? 'Set' : 'Settings'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'py-4' : ''}`}>{children}</main>
    </div>
  )
}
