import {connectWithRetry} from './ws'

export type SocketPolicy = {
  timeout: number
  attempts: number
  maxDelay?: number
}

export interface Socket {
  open(): Promise<void>
  close(code?: number, reason?: string): void
  send(data: string): void
  isOpen(): boolean
}

export interface SocketDelegate {
  socketDidOpen(socket: Socket): void
  socketDidClose(socket: Socket, code?: number, reason?: string): void
  socketDidFinish(socket: Socket): void
  socketDidReceiveMessage(socket: Socket, message: string): void
  socketShouldRetry?(socket: Socket, code: number): boolean
}

export class StableSocket implements Socket {
  private url: string
  public delegate: SocketDelegate
  private socket: WebSocket | null = null
  private opening: AbortController | null = null
  private policy: SocketPolicy

  constructor(url: string, delegate: SocketDelegate, policy: SocketPolicy) {
    this.url = url
    this.delegate = delegate
    this.policy = policy
  }

  async open(): Promise<void> {
    if (this.opening || this.socket) return
    this.opening = new AbortController()
    const policy = {...this.policy, signal: this.opening.signal}
    try {
      this.socket = await connectWithRetry(this.url, policy)
    } catch {
      this.delegate.socketDidFinish(this)
      return
    } finally {
      this.opening = null
    }
    this.socket.onclose = (event: CloseEvent) => {
      this.socket = null
      this.delegate.socketDidClose(this, event.code, event.reason)
      const fatal = this.delegate.socketShouldRetry
        ? !this.delegate.socketShouldRetry(this, event.code)
        : isFatal(event.code)
      if (fatal) {
        this.delegate.socketDidFinish(this)
      } else {
        setTimeout(() => this.open(), rand(100, 150))
      }
    }
    this.socket.onmessage = (event: MessageEvent) => {
      this.delegate.socketDidReceiveMessage(this, event.data)
    }
    this.delegate.socketDidOpen(this)
  }

  close(code?: number, reason?: string): void {
    if (this.opening) {
      this.opening.abort()
      this.opening = null
    } else if (this.socket) {
      this.socket.onclose = null
      this.socket.close(code, reason)
      this.socket = null
      this.delegate.socketDidClose(this, code, reason)
      this.delegate.socketDidFinish(this)
    }
  }

  send(data: string): void {
    if (this.socket) {
      this.socket.send(data)
    }
  }

  isOpen(): boolean {
    return !!this.socket
  }
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function isFatal(code: number): boolean {
  return code === POLICY_VIOLATION || code === INTERNAL_ERROR
}

// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
const POLICY_VIOLATION = 1008
const INTERNAL_ERROR = 1011
