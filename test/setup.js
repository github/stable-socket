import ws from 'nodejs-websocket'

let server

export function setup() {
  // Skip if server is already running
  if (server) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    server = ws
      .createServer(function (conn) {
        conn.on('text', function (msg) {
          if (msg.startsWith('echo:')) {
            conn.sendText(msg.replace('echo:', ''))
          } else if (msg.startsWith('close:')) {
            const code = msg.replace('close:', '')
            conn.close(code, 'reason')
          }
        })
        conn.on('error', function (error) {
          if (error.code !== 'ECONNRESET') throw error
        })
      })
      .listen(7999, resolve)

    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        resolve()
      } else {
        reject(error)
      }
    })
  })
}

export function teardown() {
  return new Promise(resolve => {
    if (server) {
      server.close(() => {
        server = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}
