#!/bin/bash

# Start the WebSocket server in the background
node test/websocket-server.js &

SERVER_PID=$!

# Wait for server to be ready
sleep 1

# Run vitest
npx vitest run
TEST_EXIT=$?

# Kill the server
kill $SERVER_PID 2>/dev/null

exit $TEST_EXIT
