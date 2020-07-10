const pkg = require('./package.json')

export default {
  input: 'dist/index.js',
  output: {
    file: pkg['module'],
    format: 'es'
  }
}
