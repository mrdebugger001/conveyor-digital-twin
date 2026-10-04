import React, { useEffect, useState } from 'react'
import { X, Activity, Database, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Disc3 } from 'lucide-react'
import { api } from '../../api/client'

interface VibrationAnalytics {
  rms: number
  peak: number
  crestFactor: number
  kurtosis: number
  spectralCentroidHz: number
  envelopeRms: number
  isoZone: string
  vibrationHi: number
  bearingHi: number
  motorHi: number
  compositeHealthIndex: number
  anomalyDetected: boolean
  contributingFactors: string[]
  bearingFrequenciesHz: {
    ftf_cage: number
    bpfo_outer: number
    bpfi_inner: number
    bsf_roller: number
  }
}

interface DatasetCatalogItem {
  datasetName: string
  source: string
  targetEquipment: string
  description: string
  sampleRateHz: number
  availableConditions: string[]
  isCalibrated: boolean
  citation: string
}

interface Props {
  onClose: () => void
}

export function VibrationDiagnosticsModal({ onClose }: Props) {
  const [analytics, setAnalytics] = useState<VibrationAnalytics | null>(null)
  const [catalog, setCatalog] = useState<DatasetCatalogItem[]>([])
  const [activeTab, setActiveTab] = useState<'realtime' | 'datasets'>('realtime')

  const fetchVibrationData = async () => {
    try {
      const res = await api.getVibrationFeatures()
      setAnalytics(res)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCatalog = async () => {
    try {
      const cat = await api.getDatasetCatalog()
      setCatalog(cat)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchVibrationData()
    fetchCatalog()
    const timer = setInterval(fetchVibrationData, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/40 flex items-center justify-center text-primary">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">
                  Vibration ML & Bearing Defect Kinematics
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-container text-primary font-medium">
                  ISO 10816-3 & CWRU Calibrated
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                10 kHz feature extraction (Hilbert envelope demodulation, kurtosis, defect sidebands).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-outline-variant bg-surface-high/20">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'realtime'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Live Vibration ML Features & Bearing Kinematics
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'datasets'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ingested Reference Benchmark Datasets (4)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {activeTab === 'realtime' ? (
            <>
              {/* ISO Zone & Health Indices Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
                  <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                    ISO 10816-3 Vibration Zone
                  </span>
                  <span className="text-sm font-bold text-on-surface font-mono mt-0.5 block">
                    {analytics?.isoZone ?? '--'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Medium industrial machines
                  </span>
                </div>

                <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
                  <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                    Composite Health Index
                  </span>
                  <span
                    className={`text-lg font-mono font-bold ${
                      (analytics?.compositeHealthIndex ?? 100) < 65 ? 'text-status-red' : 'text-status-green'
                    }`}
                  >
                    {analytics?.compositeHealthIndex.toFixed(0) ?? '--'}%
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Fusion of vibration, bearing, motor & joint
                  </span>
                </div>

                <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
                  <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                    Bearing Condition HI
                  </span>
                  <span className="text-lg font-mono font-bold text-primary">
                    {analytics?.bearingHi.toFixed(0) ?? '--'}%
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Envelope RMS + Kurtosis shock metric
                  </span>
                </div>

                <div className="bg-surface-high/60 border border-outline-variant rounded-lg p-3">
                  <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider block">
                    Anomaly Detection Trigger
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {analytics?.anomalyDetected ? (
                      <>
                        <ShieldAlert size={16} className="text-status-red" />
                        <span className="text-xs font-bold text-status-red">ANOMALY TRIGGERED</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} className="text-status-green" />
                        <span className="text-xs font-bold text-status-green">NORMAL BASELINE</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Mahalanobis distance &gt; 3.5σ
                  </span>
                </div>
              </div>

              {/* Time & Frequency Domain Feature Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time-Domain Card */}
                <div className="bg-surface-high/30 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Time-Domain Statistical Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">RMS Velocity</span>
                      <span className="text-sm font-bold text-on-surface">{analytics?.rms.toFixed(2) ?? '--'} mm/s</span>
                    </div>
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">Peak Amplitude</span>
                      <span className="text-sm font-bold text-on-surface">{analytics?.peak.toFixed(2) ?? '--'} mm/s</span>
                    </div>
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">Crest Factor</span>
                      <span className="text-sm font-bold text-on-surface">{analytics?.crestFactor.toFixed(2) ?? '--'}</span>
                    </div>
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">Kurtosis (Normal=3.0)</span>
                      <span
                        className={`text-sm font-bold ${
                          (analytics?.kurtosis ?? 3.0) > 4.5 ? 'text-status-red' : 'text-on-surface'
                        }`}
                      >
                        {analytics?.kurtosis.toFixed(2) ?? '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spectral & Envelope Card */}
                <div className="bg-surface-high/30 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Frequency & Envelope Demodulation
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">Spectral Centroid</span>
                      <span className="text-sm font-bold text-primary">
                        {analytics?.spectralCentroidHz.toFixed(1) ?? '--'} Hz
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant">
                      <span className="text-[10px] text-on-surface-variant block">Hilbert Envelope RMS</span>
                      <span className="text-sm font-bold text-on-surface">
                        {analytics?.envelopeRms.toFixed(3) ?? '--'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-high/60 border border-outline-variant col-span-2">
                      <span className="text-[10px] text-on-surface-variant block mb-1">
                        Contributing Physical Factors
                      </span>
                      {analytics?.contributingFactors?.length ? (
                        <div className="flex flex-col gap-1">
                          {analytics.contributingFactors.map((f, i) => (
                            <span key={i} className="text-status-amber text-[11px] font-sans flex items-center gap-1">
                              • {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-status-green text-[11px] font-sans">
                          All vibration signatures within normal operational baseline.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theoretical Bearing Characteristic Frequencies */}
              <div className="bg-surface-high/40 border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Disc3 size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                      Drive Motor Bearing Fault Kinematics (SKF 6205-2RS)
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Formulas: D_p=39.04mm, d=7.94mm, Z=9 balls, α=0°
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-surface-high border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block">FTF (Cage Frequency)</span>
                    <span className="text-sm font-bold text-on-surface">
                      {analytics?.bearingFrequenciesHz?.ftf_cage.toFixed(1) ?? '--'} Hz
                    </span>
                    <span className="text-[9px] text-on-surface-variant mt-0.5 block">0.398 × f_shaft</span>
                  </div>

                  <div className="p-2.5 rounded bg-surface-high border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block">BPFO (Outer Race Pass)</span>
                    <span className="text-sm font-bold text-primary">
                      {analytics?.bearingFrequenciesHz?.bpfo_outer.toFixed(1) ?? '--'} Hz
                    </span>
                    <span className="text-[9px] text-on-surface-variant mt-0.5 block">3.585 × f_shaft</span>
                  </div>

                  <div className="p-2.5 rounded bg-surface-high border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block">BPFI (Inner Race Pass)</span>
                    <span className="text-sm font-bold text-primary">
                      {analytics?.bearingFrequenciesHz?.bpfi_inner.toFixed(1) ?? '--'} Hz
                    </span>
                    <span className="text-[9px] text-on-surface-variant mt-0.5 block">5.415 × f_shaft</span>
                  </div>

                  <div className="p-2.5 rounded bg-surface-high border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block">BSF (Ball Spin)</span>
                    <span className="text-sm font-bold text-on-surface">
                      {analytics?.bearingFrequenciesHz?.bsf_roller.toFixed(1) ?? '--'} Hz
                    </span>
                    <span className="text-[9px] text-on-surface-variant mt-0.5 block">2.357 × f_shaft</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Ingested Reference Benchmark Datasets Catalog */
            <div className="flex flex-col gap-3">
              <span className="text-xs text-on-surface-variant">
                The digital twin integrates four canonical industrial condition monitoring datasets for parameter calibration and fault envelope benchmarking:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalog.map((item, idx) => (
                  <div key={idx} className="bg-surface-high/50 border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface font-sans">{item.datasetName}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-primary-container text-primary font-semibold">
                        {item.sampleRateHz} Hz
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant">{item.description}</p>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.availableConditions.map((c, ci) => (
                        <span key={ci} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-high border border-outline-variant text-on-surface">
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-outline-variant/40 mt-auto flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>Target: {item.targetEquipment}</span>
                      <span className="text-primary truncate max-w-[200px]" title={item.citation}>
                        {item.citation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant bg-surface-high/40">
          <span className="text-[11px] text-on-surface-variant">
            Bearing fault frequencies update dynamically with motor shaft VFD RPM.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-high border border-outline-variant text-on-surface hover:text-primary text-xs font-semibold transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  )
}
