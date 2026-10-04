import React, { useState } from 'react'
import {
  X,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Package,
  DollarSign,
  AlertOctagon,
  ExternalLink,
  Send,
} from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'
import { api } from '../../api/client'
import type { SapDispatchWorkOrderResponse } from '../../types/twin'

export function SapDispatchModal() {
  const { isSapModalOpen, closeSapModal, sapTargetAssetId, conveyor } = useTwinStore()

  const [technician, setTechnician] = useState('Lead Splice Specialist (Crew #2)')
  const [downtimeHours, setDowntimeHours] = useState(4.5)
  const [notes, setNotes] = useState('Emergency splice vulcanization required before cord pullout propagates.')
  const [loading, setLoading] = useState(false)
  const [dispatchedOrder, setDispatchedOrder] = useState<SapDispatchWorkOrderResponse | null>(null)

  if (!isSapModalOpen) return null

  const assetId = sapTargetAssetId || 'joint-J023'
  const cleanId = assetId.replace('joint-', '').replace('motor-', '')
  const isJoint = assetId.includes('joint') || cleanId.startsWith('J')

  const jointData = isJoint && conveyor?.jointHealth[cleanId] ? conveyor.jointHealth[cleanId] : null
  const stressVal = jointData?.stressMpa ?? 14.8
  const minerVal = jointData?.minerDamage ?? 0.82

  const handleDispatch = async () => {
    setLoading(true)
    try {
      const res = await api.dispatchSapWorkOrder({
        assetId,
        technician,
        downtimeWindowHours: downtimeHours,
        notes,
      })
      setDispatchedOrder(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDispatchedOrder(null)
    closeSapModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-red/20 border border-status-red/40 flex items-center justify-center text-status-red">
              <Wrench size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">SAP PM Work Order Dispatch</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface border border-outline-variant text-primary">
                  SAP ECC / S4-HANA CMMS
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Target Equipment: CV01-{cleanId} · Hot Vulcanized Splice Replacement
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {dispatchedOrder ? (
            /* Successful Dispatch Confirmation Screen */
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-status-green/20 border border-status-green/50 flex items-center justify-center text-status-green mb-3 animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">Work Order Successfully Dispatched</h3>
              <p className="text-xs text-on-surface-variant max-w-md mb-6">
                {dispatchedOrder.notificationMsg}
              </p>

              <div className="w-full bg-surface border border-outline-variant rounded-xl p-4 text-left font-mono text-xs flex flex-col gap-2.5 mb-6">
                <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-on-surface-variant">SAP Work Order:</span>
                  <span className="text-primary font-bold">{dispatchedOrder.workOrderId}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-on-surface-variant">Equipment:</span>
                  <span className="text-on-surface font-semibold">{dispatchedOrder.equipmentTag}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-on-surface-variant">Priority:</span>
                  <span className="text-status-red font-bold">{dispatchedOrder.priority}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-on-surface-variant">Scheduled Window:</span>
                  <span className="text-on-surface">{dispatchedOrder.downtimeWindowHours} Hours (Starts ~1.5h)</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-on-surface-variant">Est. Spare & Labor Cost:</span>
                  <span className="text-status-green font-bold">
                    ${dispatchedOrder.costEstimateUsd.toLocaleString()} USD
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-1">Reserved Kit Bill of Materials:</span>
                  <ul className="list-disc list-inside text-on-surface pl-1 flex flex-col gap-1">
                    {dispatchedOrder.requiredSpareParts.map((sp, i) => (
                      <li key={i}>{sp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-surface font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                Close & Return to Twin Console
              </button>
            </div>
          ) : (
            /* Work Order Form Draft */
            <div className="flex flex-col gap-5">
              {/* Order Header Summary */}
              <div className="p-3.5 rounded-lg bg-surface border border-outline-variant flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                    SAP PM Notification
                  </span>
                  <span className="text-sm font-bold text-on-surface">#WO-COAL-9{cleanId.replace('J', '')}-VULC</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-red/15 text-status-red text-xs font-bold border border-status-red/40">
                  <AlertOctagon size={13} />
                  <span>CRITICAL (P1)</span>
                </div>
              </div>

              {/* Failure Context from Twin Physics */}
              <div className="p-3.5 rounded-lg bg-surface-high border border-outline-variant">
                <span className="text-xs font-bold text-on-surface block mb-1.5">
                  Detected Failure Mode (DIN 22101 Ground Truth)
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed font-mono">
                  {isJoint
                    ? `Multi-Axis Splice Fatigue Degradation (Miner Index D = ${minerVal.toFixed(2)}, Stress = ${stressVal.toFixed(1)} MPa). High risk of transverse steel cord pullout under ${conveyor?.coalFlow?.toFixed(0) ?? 1200} TPH coal bulk payload.`
                    : 'Drive Motor Stator Thermal Excursion & Bearing Eddy Current Wear.'}
                </p>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-primary" />
                    Assigned Lead Technician
                  </label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    Required Downtime Window
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      max={12}
                      value={downtimeHours}
                      onChange={(e) => setDowntimeHours(Number(e.target.value))}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <span className="text-xs text-on-surface-variant font-mono">Hours</span>
                  </div>
                </div>
              </div>

              {/* Spare Parts Bill of Materials */}
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-2 flex items-center gap-1.5">
                  <Package size={13} className="text-primary" />
                  Reserved Spare Parts (Inventory Checked)
                </label>
                <div className="bg-surface rounded-lg border border-outline-variant p-3 flex flex-col gap-1.5 text-xs font-mono text-on-surface">
                  <div className="flex items-center gap-2 text-status-green">
                    <CheckCircle2 size={13} />
                    <span>Hot Vulcanizing Splice Kit #STL-CORD-ST2500 (1400mm) - In Stock</span>
                  </div>
                  <div className="flex items-center gap-2 text-status-green">
                    <CheckCircle2 size={13} />
                    <span>Cover Rubber Tie Gum Strip (2.5mm Grade X) - In Stock</span>
                  </div>
                  <div className="flex items-center gap-2 text-status-green">
                    <CheckCircle2 size={13} />
                    <span>Steel Cord Alignment Clamps (Set of 8) - In Stock</span>
                  </div>
                  <div className="flex items-center gap-2 text-status-green">
                    <CheckCircle2 size={13} />
                    <span>Neoprene Cold-Bond Edge Adhesive (5L Can) - In Stock</span>
                  </div>
                </div>
              </div>

              {/* Dispatch Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleDispatch}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-status-red text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{loading ? 'Transmitting to SAP S4/HANA...' : 'Confirm & Dispatch Work Order to SAP'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
