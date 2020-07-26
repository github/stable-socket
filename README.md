# StableSocket

A web socket that reconnects.

## Installation

```
$ npm install @github/stable-socket
```

## Usage

```ts
import {StableSocket} from '@github/stable-socket'

const delegate = {
  socketDidOpen(socket: Socket) {
    // Socket is ready to write.
    socket.send('Hello')
  },
  socketDidClose(socket: Socket, code?: number, reason?: string) {
    // Socket closed and will retry the connection.
  },
  socketDidFinish(socket: Socket) {
    // Socket closed for good and will not retry.
  },
  socketDidReceiveMessage(socket: Socket, message: string) {
    // Socket read data from the connection.
  },
  socketShouldRetry(socket: Socket, code: number): boolean {
    // Socket reconnects unless server returns the policy violation code.
    return code !== 1008
  }
}

const policy = {
  timeout: 4000,
  attempts: Infinity,
  maxDelay: 60000
}

const url = 'wss://live.example.com'
const socket = new StableSocket(url , delegate, policy)
socket.open()
```

### BufferedSocket

Writing to a StableSocket while it is in the opening or closed states
discards the message data. Use a BufferedSocket to buffer writes to be
sent when it opens.

```ts
import {BufferedSocket, StableSocket} from '@github/stable-socket'
const socket = new BufferedSocket(new StableSocket(url, delegate, policy))
socket.open()
socket.send('hello') // Will be sent when the socket is open.
```

### Asynchronous connections

StableSocket and BufferedSocket are abstractions over a WebSocket that
maintain an internal state machine, managing reconnects and preventing writes
to closed sockets. However, sometimes we need direct access to an open WebSocket
in async functions.

#### connect

Asynchronously connects to a web socket port or fails after a timeout. The
socket is open, and writable with `send`, when its promise is fulfilled.
Returns a Promise fulfilled with an open WebSocket or rejected with a
connection failure.

```ts
import {connect} from '@github/stable-socket'

try {
  const socket = await connect('wss://live.example.com', 100)
  socket.send('hi')
} catch (e) {
  console.log('Socket connection failed', e)
}
```

#### connectWithRetry

Asynchronously connects to a web socket port, retrying failed connections
with exponential backoff. Returns a Promise fulfilled with an open WebSocket
or rejected with a connection failure.

```ts
import {connectWithRetry} from '@github/stable-socket'

try {
  const policy = {timeout: 100, attempts: Infinity, maxDelay: 60000}
  const socket = await connectWithRetry('wss://live.example.com', policy)
  socket.send('hi')
} catch (e) {
  console.log('Socket connection failed', e)
}
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
