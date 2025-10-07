import ws from 'nodejs-websocket'

let server

export function setup() {
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
    .listen(7999)
}

export function teardown() {
  if (server) {
    server.close()
  }
}
