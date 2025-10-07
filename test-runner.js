#!/usr/bin/env node
import {spawn} from 'child_process'
import ws from 'nodejs-websocket'

let server
let vitestProcess

// Start WebSocket server
function startServer() {
  return new Promise((resolve) => {
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
        console.log('WebSocket server started on port 7999')
        resolve()
      })
  })
}

// Run vitest
function runVitest() {
  return new Promise((resolve, reject) => {
    vitestProcess = spawn('npx', ['vitest', 'run'], {
      stdio: 'inherit',
      shell: true,
    })

    vitestProcess.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Vitest exited with code ${code}`))
      }
    })

    vitestProcess.on('error', (err) => {
      reject(err)
    })
  })
}

// Cleanup
function cleanup() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('WebSocket server stopped')
        resolve()
      })
    } else {
      resolve()
    }
  })
}

// Main
async function main() {
  try {
    await startServer()
    await runVitest()
    await cleanup()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    await cleanup()
    process.exit(1)
  }
}

// Handle signals
process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up...')
  await cleanup()
  process.exit(130)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...')
  await cleanup()
  process.exit(143)
})

main()
