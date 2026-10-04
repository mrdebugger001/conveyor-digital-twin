import React, { useState } from 'react'
import { ConveyorScene } from '../components/three/ConveyorScene'
import { KpiBar } from '../components/hmi/KpiBar'
import { ControlPanel } from '../components/hmi/ControlPanel'
import { AssetInspector } from '../components/hmi/AssetInspector'
import { AlarmBar } from '../components/hmi/AlarmBar'
import { FaultInjectionPanel } from '../components/hmi/FaultInjectionPanel'
import { WhatIfSandboxModal } from '../components/hmi/WhatIfSandboxModal'
import { OpticalSpliceInspectorModal } from '../components/hmi/OpticalSpliceInspectorModal'
import { SapDispatchModal } from '../components/hmi/SapDispatchModal'
import { TensionProfileModal } from '../components/hmi/TensionProfileModal'
import { ModelValidationModal } from '../components/hmi/ModelValidationModal'
import { VibrationDiagnosticsModal } from '../components/hmi/VibrationDiagnosticsModal'
import { ProvenanceModal } from '../components/hmi/ProvenanceModal'
import { useTwinStore } from '../store/twinStore'
import { Zap, Sliders, Eye, TrendingUp, Gauge, Activity, ShieldCheck } from 'lucide-react'

export function DigitalTwinPage() {
  const [showSimulator, setShowSimulator] = useState(false)
  const [showTensionProfile, setShowTensionProfile] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showVibration, setShowVibration] = useState(false)
  const [showProvenance, setShowProvenance] = useState(false)

  const connectionStatus = useTwinStore((s) => s.connectionStatus)
  const conveyor = useTwinStore((s) => s.conveyor)
  const setWhatIfOpen = useTwinStore((s) => s.setWhatIfOpen)
  const setOpticalInspectorOpen = useTwinStore((s) => s.setOpticalInspectorOpen)
  const setSelectedAsset = useTwinStore((s) => s.setSelectedAsset)

  const mode = conveyor?.mode ?? 'SIMULATION'
  const isThrottleActive = conveyor?.smartThrottleActive ?? false
  const deratePct = conveyor?.smartThrottleDeratePct ?? 0

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-surface relative">
      {/* Top Banner KPI Telemetry Bar (Coal TPH, Linear Mass, Peak Stress MPa, Sag mm) */}
      <KpiBar />

      {/* Main Center Area: 3D Viewport + Asset Inspector Sidebar */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* 3D Viewport Container */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
          {/* Real 3D Conveyor Canvas with Coal Stream & FEA Stress Heatmap */}
          <ConveyorScene />

          {/* Floating Industrial Analytics & Engineering Dock (Bottom Center of 3D Canvas) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-surface-container/95 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded-full shadow-2xl max-w-[95vw] overflow-x-auto">
            {/* Engineering Diagnostics Group */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowTensionProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-high/80 text-on-surface hover:text-primary hover:bg-primary-container/40 border border-outline-variant/60 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                title="1D Distributed Tension Profile & 24 Splice Stresses"
              >
                <TrendingUp size={13} className="text-primary" />
                <span>Tension Profile</span>
              </button>

              <button
                onClick={() => setShowValidation(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-high/80 text-on-surface hover:text-status-green hover:bg-status-green/15 border border-outline-variant/60 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                title="Physics Residuals & Analytical Redundancy"
              >
                <Gauge size={13} className="text-status-green" />
                <span>Model Residuals</span>
              </button>

              <button
                onClick={() => setShowVibration(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-high/80 text-on-surface hover:text-primary hover:bg-primary-container/40 border border-outline-variant/60 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                title="Vibration ML Features & SKF Bearing Fault Kinematics"
              >
                <Activity size={13} className="text-primary" />
                <span>Vibration ML</span>
              </button>

              <button
                onClick={() => setShowProvenance(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-high/80 text-on-surface hover:text-blue-400 hover:bg-blue-500/15 border border-outline-variant/60 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                title="Parameter Data Provenance & Uncertainty Registry"
              >
                <ShieldCheck size={13} className="text-blue-400" />
                <span>Provenance</span>
              </button>
            </div>

            <div className="w-px h-5 bg-outline-variant mx-1" />

            {/* Simulation & Operations Group */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWhatIfOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/30 border border-primary/40 text-primary hover:bg-primary hover:text-surface font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
                title="CEMA DIN 22101 What-If Parameter Sandbox"
              >
                <Sliders size={13} />
                <span>What-If</span>
              </button>

              <button
                onClick={() => setOpticalInspectorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-green/15 border border-status-green/30 text-status-green hover:bg-status-green hover:text-surface font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
                title="Edge AI 4K Line-Scan Splice Camera"
              >
                <Eye size={13} />
                <span>Splice Vision</span>
              </button>

              <button
                onClick={() => setShowSimulator(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-high/80 border border-outline-variant/60 text-on-surface hover:text-status-amber hover:bg-status-amber/15 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                title="Inject mechanical faults"
              >
                <Zap size={13} className="text-status-amber" />
                <span>Faults</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Asset Inspector Sidebar */}
        <AssetInspector />
      </div>

      {/* HMI Conveyor Operational Control Bar */}
      <ControlPanel />

      {/* Real-time Alarm Notification & Drawer Bar */}
      <AlarmBar />

      {/* Fault Injection & Simulation Modal Overlay */}
      {showSimulator && <FaultInjectionPanel onClose={() => setShowSimulator(false)} />}

      {/* 1D Tension Profile & 24 Splice Kinematics Modal */}
      {showTensionProfile && (
        <TensionProfileModal
          onClose={() => setShowTensionProfile(false)}
          onSelectJoint={(jid) => setSelectedAsset(jid)}
        />
      )}

      {/* Physics Residuals & Model Validation Modal */}
      {showValidation && <ModelValidationModal onClose={() => setShowValidation(false)} />}

      {/* Vibration ML & Bearing Kinematics Modal */}
      {showVibration && <VibrationDiagnosticsModal onClose={() => setShowVibration(false)} />}

      {/* Parameter Data Provenance Modal */}
      {showProvenance && <ProvenanceModal onClose={() => setShowProvenance(false)} />}

      {/* CEMA What-If Scenario Sandbox Modal */}
      <WhatIfSandboxModal />

      {/* Edge AI Optical Splice Inspector Modal */}
      <OpticalSpliceInspectorModal />

      {/* SAP CMMS Work Order Dispatch Modal */}
      <SapDispatchModal />
    </div>
  )
}

