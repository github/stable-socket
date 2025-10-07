import ws from 'nodejs-websocket'

const server = ws.createServer(function (conn) {
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

server.listen(7999, () => {
  console.log('WebSocket test server listening on port 7999')
})

// Keep the process running
process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
