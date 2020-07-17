import type {Socket, SocketDelegate, StableSocket} from './stable-socket'
import {isFatal} from './stable-socket'

export class BufferedSocket implements Socket, SocketDelegate {
  private buf: string[] = []
  private socket: Socket
  private delegate: SocketDelegate

  constructor(socket: StableSocket) {
    this.socket = socket
    this.delegate = socket.delegate
    socket.delegate = this
  }

  open(): Promise<void> {
    return this.socket.open()
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason)
  }

  send(data: string): void {
    if (this.socket.isOpen()) {
      this.flush()
      this.socket.send(data)
    } else {
      this.buf.push(data)
    }
  }

  isOpen(): boolean {
    return this.socket.isOpen()
  }

  flush(): void {
    for (const data of this.buf) {
      this.socket.send(data)
    }
    this.buf.length = 0
  }

  socketDidOpen(socket: Socket): void {
    this.flush()
    this.delegate.socketDidOpen(socket)
  }

  socketDidClose(socket: Socket, code?: number, reason?: string): void {
    this.delegate.socketDidClose(socket, code, reason)
  }

  socketDidFinish(socket: Socket): void {
    this.delegate.socketDidFinish(socket)
  }

  socketDidReceiveMessage(socket: Socket, message: string): void {
    this.delegate.socketDidReceiveMessage(socket, message)
  }

  socketShouldRetry(socket: Socket, code: number): boolean {
    return this.delegate.socketShouldRetry ? this.delegate.socketShouldRetry(socket, code) : !isFatal(code)
  }
}
