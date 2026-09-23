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
  setFaults: (config: any) => request('/simulator/fault', { method: 'POST', body: JSON.stringify(config) }),
  getFaults: () => request<any>('/simulator/faults'),
  getPrediction: (assetId: string) => request<any>(`/predictions/${assetId}`),
  getHistory: (assetId: string, metric: string, points = 60) =>
    request<any>(`/history/${assetId}?metric=${metric}&points=${points}`),
  getMaintenance: () => request<any[]>('/maintenance'),
}
