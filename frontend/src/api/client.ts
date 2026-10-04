import type {
  WhatIfRequest,
  WhatIfResponse,
  SapDispatchWorkOrderRequest,
  SapDispatchWorkOrderResponse,
} from '../types/twin'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  getAssets: () => request('/assets'),
  getAlarms: (params?: { severity?: string; acknowledged?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.severity) q.set('severity', params.severity)
    if (params?.acknowledged !== undefined) q.set('acknowledged', String(params.acknowledged))
    return request<any[]>(`/alarms?${q}`)
  },
  acknowledgeAlarm: (id: string, by: string) =>
    request(`/alarms/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ acknowledgedBy: by }) }),
  startConveyor: () => request('/control/C01/start', { method: 'POST', body: '{}' }),
  stopConveyor: () => request('/control/C01/stop', { method: 'POST', body: '{}' }),
  resetConveyor: () => request('/control/C01/reset', { method: 'POST', body: '{}' }),
  setSpeed: (speed: number) => request('/control/C01/speed', { method: 'POST', body: JSON.stringify({ targetSpeed: speed }) }),
  estop: () => request('/control/C01/estop', { method: 'POST', body: '{}' }),
  toggleSmartThrottle: (enabled: boolean) =>
    request('/control/C01/smart-throttle', { method: 'POST', body: JSON.stringify({ enabled }) }),
  setCoalFeed: (coalTph: number, moisturePct = 6.5) =>
    request('/control/C01/coal-feed', { method: 'POST', body: JSON.stringify({ coalTph, moisturePct }) }),
  setFaults: (config: any) => request('/simulator/fault', { method: 'POST', body: JSON.stringify(config) }),
  getFaults: () => request<any>('/simulator/faults'),
  getPrediction: (assetId: string) => request<any>(`/predictions/${assetId}`),
  getHistory: (assetId: string, metric: string, points = 60) =>
    request<any>(`/history/${assetId}?metric=${metric}&points=${points}`),
  getMaintenance: () => request<any[]>('/maintenance'),
  calculateWhatIf: (req: WhatIfRequest) =>
    request<WhatIfResponse>('/simulator/what-if', { method: 'POST', body: JSON.stringify(req) }),
  applyWhatIf: (req: WhatIfRequest) =>
    request('/simulator/what-if/apply', { method: 'POST', body: JSON.stringify(req) }),
  resetWhatIf: () =>
    request('/simulator/what-if/reset', { method: 'POST' }),
  dispatchSapWorkOrder: (req: SapDispatchWorkOrderRequest) =>
    request<SapDispatchWorkOrderResponse>('/maintenance/dispatch-sap', { method: 'POST', body: JSON.stringify(req) }),
  getTensionProfile: () => request<any>('/conveyor/tension-profile'),
  getJoints: () => request<any[]>('/conveyor/joints'),
  getJointDetail: (id: string) => request<any>(`/conveyor/joints/${id}`),
  getResiduals: () => request<any>('/twin/residuals'),
  getVibrationFeatures: () => request<any>('/vibration/features'),
  getDataProvenance: () => request<any>('/data/provenance'),
  getDatasetCatalog: () => request<any[]>('/data/catalog'),
  getNasaDegradation: () => request<any[]>('/data/nasa-ims/degradation'),
  calibrate: (targetParameter: string) =>
    request<any>('/twin/calibrate', { method: 'POST', body: JSON.stringify({ targetParameter }) }),
  getOperatingProfile: () => request<any>('/twin/operating-profile'),
  setOperatingProfile: (profile: string) =>
    request<any>('/twin/operating-profile', { method: 'POST', body: JSON.stringify({ profile }) }),
}
