const ws = require('nodejs-websocket')

ws.createServer(function (conn) {
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
}).listen(7999)

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      {pattern: 'dist/index.js', type: 'module'},
      {pattern: 'dist/async-tasks.js', type: 'module'},
      {pattern: 'test/test.js', type: 'module'}
    ],
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  })
}
