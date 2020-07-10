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
  }
}

const policy = {
  timeout: 4000,
  attempts: Infinity,
  maxDelay: 60000
}

const socket = new StableSocket('wss://live.example.com', delegate, policy)
socket.open()
```

## Development

```
npm install
npm test
```

## License

Distributed under the MIT license. See LICENSE for details.
