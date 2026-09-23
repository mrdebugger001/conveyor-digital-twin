import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Mountain, Gauge, Hammer, Filter, Package, Truck,
  BellRing, BarChart2, Wrench, Settings
} from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'

const NAV_ITEMS = [
  { label: 'Mine', icon: Mountain, path: '/mine', disabled: true },
  { label: 'Conveyor C01', icon: Gauge, path: '/' },
  { label: 'Crusher', icon: Hammer, path: '/crusher', disabled: true },
  { label: 'Screen', icon: Filter, path: '/screen', disabled: true },
  { label: 'Stockyard', icon: Package, path: '/stockyard', disabled: true },
  { label: 'Dispatch', icon: Truck, path: '/dispatch', disabled: true },
]

const NAV_BOTTOM = [
  { label: 'Alarms', icon: BellRing, path: '/alarms' },
  { label: 'Analytics', icon: BarChart2, path: '/analytics' },
  { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
  { label: 'Settings', icon: Settings, path: '/settings', disabled: true },
]

type NavItemType = { label: string; icon: React.ElementType; path: string; disabled?: boolean }

function NavItem({ item }: { item: NavItemType }) {
  const location = useLocation()
  const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  const alarms = useTwinStore((s) => s.alarms)
  const unackedAlarms = alarms.filter((a) => !a.acknowledged).length

  if (item.disabled) {
    return (
      <div className="flex flex-col items-center py-2 px-1 opacity-25 cursor-not-allowed select-none">
        <div className="w-12 h-7 flex items-center justify-center rounded-full">
          <item.icon size={19} className="text-on-surface-variant" />
        </div>
        <span className="text-[10px] text-on-surface-variant text-center leading-tight mt-0.5">
          {item.label}
        </span>
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className="flex flex-col items-center py-2 px-1 group transition-colors select-none relative"
    >
      {/* Material 3 indicator pill */}
      <div
        className={`w-12 h-7 flex items-center justify-center rounded-full transition-all relative ${
          isActive
            ? 'bg-primary-container text-primary shadow-sm'
            : 'text-on-surface-variant group-hover:text-on-surface group-hover:bg-surface-high'
        }`}
      >
        <item.icon size={19} />
        {item.label === 'Alarms' && unackedAlarms > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-red text-white text-[9px] font-mono font-bold flex items-center justify-center">
            {unackedAlarms}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] text-center leading-tight mt-1 transition-colors ${
          isActive ? 'font-medium text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
        }`}
      >
        {item.label}
      </span>
    </NavLink>
  )
}

export function NavRail() {
  return (
    <nav className="flex flex-col w-[76px] bg-surface-container border-r border-outline-variant flex-shrink-0 py-2 gap-0.5 justify-between select-none z-30">
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="mx-3 my-1.5 border-t border-outline-variant/60" />
        {NAV_BOTTOM.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>
    </nav>
  )
}
