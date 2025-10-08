#!/bin/bash

# Start the WebSocket server in the background
node -e "
const ws = require('nodejs-websocket');
ws.createServer(function (conn) {
  conn.on('text', function (msg) {
    if (msg.startsWith('echo:')) {
      conn.sendText(msg.replace('echo:', ''));
    } else if (msg.startsWith('close:')) {
      const code = msg.replace('close:', '');
      conn.close(parseInt(code), 'reason');
    }
  });
  conn.on('error', function (error) {
    if (error.code !== 'ECONNRESET') throw error;
  });
}).listen(7999, () => console.log('WebSocket server ready'));
" &

SERVER_PID=$!

# Wait for server to be ready
sleep 1

# Run vitest
npx vitest run
TEST_EXIT=$?

# Kill the server
kill $SERVER_PID 2>/dev/null

exit $TEST_EXIT
