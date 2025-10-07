import ws from 'nodejs-websocket'

let server

export async function setup() {
  return new Promise(resolve => {
    server = ws
      .createServer(function (conn) {
        conn.on('text', function (msg) {
          if (msg.startsWith('echo:')) {
            conn.sendText(msg.replace('echo:', ''))
          } else if (msg.startsWith('close:')) {
            const code = msg.replace('close:', '')
            conn.close(parseInt(code), 'reason')
          }
        })
        conn.on('error', function (error) {
          if (error.code !== 'ECONNRESET') throw error
        })
      })
      .listen(7999, () => {
        resolve()
      })
  })
}

export async function teardown() {
  return new Promise(resolve => {
    if (server) {
      server.close(() => {
        resolve()
      })
    } else {
      resolve()
    }
  })
}
