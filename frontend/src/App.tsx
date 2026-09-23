import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TopBar } from './components/hmi/TopBar'
import { NavRail } from './components/hmi/NavRail'
import { DigitalTwinPage } from './pages/DigitalTwinPage'
import { AlarmsPage } from './pages/AlarmsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { SettingsPage } from './pages/SettingsPage'
import { connectSocket } from './api/socket'

export default function App() {
  useEffect(() => {
    connectSocket()
  }, [])

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          <NavRail />
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<DigitalTwinPage />} />
              <Route path="/alarms" element={<AlarmsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<DigitalTwinPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
