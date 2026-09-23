import { useTwinStore } from '../store/twinStore'
import type { ConveyorState, Alarm } from '../types/twin'

let ws: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000

export function connectSocket() {
  const { setConveyor, addAlarm, updateAlarm, setConnectionStatus } = useTwinStore.getState()

  const url = `ws://${window.location.hostname}:8000/ws/realtime`
  ws = new WebSocket(url)

  ws.onopen = () => {
    setConnectionStatus('ONLINE')
    reconnectDelay = 1000
    // Send a keep-alive ping every 15s
    const ping = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send('ping')
    }, 15000)
    ws!.onclose = () => {
      clearInterval(ping)
      setConnectionStatus('RECONNECTING')
      scheduleReconnect()
    }
  }

  ws.onerror = () => {
    setConnectionStatus('RECONNECTING')
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'twin_state':
          setConveyor(msg.payload as ConveyorState)
          break
        case 'alarm_new':
          addAlarm(msg.payload as Alarm)
          break
        case 'alarm_update':
          updateAlarm(msg.payload as Alarm)
          break
        case 'heartbeat':
          break
      }
    } catch {
      // ignore parse errors
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  reconnectTimeout = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    connectSocket()
  }, reconnectDelay)
}

export function disconnectSocket() {
  ws?.close()
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
}
