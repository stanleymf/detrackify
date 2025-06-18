import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LayoutProps {
  children: React.ReactNode
  activeTab: "dashboard" | "settings"
  onTabChange: (tab: "dashboard" | "settings") => void
  onLogout: () => void
}

export function Layout({ children, activeTab, onTabChange, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-dust-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-olive-600">Detrackify</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Tabs value={activeTab} onValueChange={onTabChange as (value: string) => void}>
                <TabsList className="bg-dust-200">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-olive-600 data-[state=active]:text-white"
                  >
                    Dashboard
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
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
