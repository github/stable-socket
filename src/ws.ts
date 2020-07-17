import {retry, timeout} from './async-tasks'

export type ConnectPolicy = {
  timeout: number
  attempts: number
  maxDelay?: number
  signal?: AbortSignal
}

export async function connect(url: string, ms: number, signal?: AbortSignal): Promise<WebSocket> {
  const socket = new WebSocket(url)
  const opened = whenOpen(socket)
  try {
    await Promise.race([opened, timeout(ms, signal)])
    return socket
  } catch (e) {
    shutdown(opened)
    throw e
  }
}

async function shutdown(opened: Promise<WebSocket>) {
  try {
    const socket = await opened
    socket.close()
  } catch {
    // ignore
  }
}

export function connectWithRetry(url: string, policy: ConnectPolicy): Promise<WebSocket> {
  const fn = () => connect(url, policy.timeout, policy.signal)
  return retry(fn, policy.attempts, policy.maxDelay, policy.signal)
}

function whenOpen(socket: WebSocket): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve(socket)
    } else {
      socket.onerror = () => {
        socket.onerror = null
        socket.onopen = null
        reject(new Error('connect failed'))
      }
      socket.onopen = () => {
        socket.onerror = null
        socket.onopen = null
        resolve(socket)
      }
    }
  })
}
