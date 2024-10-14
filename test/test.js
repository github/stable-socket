// eslint-disable-next-line import/extensions
import {retry, timeout, wait} from '../dist/async-tasks.js'
// eslint-disable-next-line import/extensions
import {StableSocket} from '../dist/index.js'

class Delegate {
  constructor(fatal) {
    this.fatal = fatal
    this.states = []
  }
  socketDidOpen() {
    this.states.push('open')
  }
  socketDidClose() {
    this.states.push('closed')
  }
  socketDidFinish() {
    this.states.push('finished')
  }
  socketDidReceiveMessage(socket, message) {
    this.states.push(`msg:${message}`)
  }
  socketShouldRetry(socket, code) {
    return code !== this.fatal
  }
}

describe('StableSocket', function () {
  it('invokes lifecycle delegate methods', async function () {
    const url = 'ws://localhost:7999'
    const delegate = new Delegate(0)
    const policy = {timeout: 100, attempts: 1, maxDelay: 100}
    const socket = new StableSocket(url, delegate, policy)
    await socket.open()
    assert(socket.isOpen())
    assert.deepEqual(['open'], delegate.states)
    socket.send('echo:hello')
    await wait(10)
    socket.close()
    assert.deepEqual(['open', 'msg:hello', 'closed', 'finished'], delegate.states)
  })

  it('retries on non-fatal close code', async function () {
    const url = 'ws://localhost:7999'
    const delegate = new Delegate(0)
    const policy = {timeout: 100, attempts: 1, maxDelay: 100}
    const socket = new StableSocket(url, delegate, policy)
    await socket.open()
    assert(socket.isOpen())
    assert.deepEqual(['open'], delegate.states)
    socket.send('close:1000')
    await wait(200)
    assert.deepEqual(['open', 'closed', 'open'], delegate.states)
    socket.close()
  })

  it('does not retry on fatal close code', async function () {
    const url = 'ws://localhost:7999'
    const delegate = new Delegate(4000)
    const policy = {timeout: 100, attempts: 1, maxDelay: 100}
    const socket = new StableSocket(url, delegate, policy)
    await socket.open()
    assert(socket.isOpen())
    assert.deepEqual(['open'], delegate.states)
    socket.send('close:4000')
    await wait(200)
    assert.deepEqual(['open', 'closed', 'finished'], delegate.states)
  })
})

describe('async-tasks', function () {
  describe('timeout', function () {
    it('rejects', async function () {
      try {
        await timeout(10)
        assert.fail('resolved')
      } catch {
        assert.isOk(true)
      }
    })
    it('rejects before wait resolves', async function () {
      try {
        await Promise.race([timeout(100), wait(200)])
        assert.fail('resolved')
      } catch {
        assert.isOk(true)
      }
    })
    it('can be canceled immediately', async function () {
      const controller = new AbortController()
      controller.abort()
      try {
        await timeout(100, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('can be canceled while waiting', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 50)
      try {
        await timeout(200, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('settles if canceled later', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 200)
      try {
        await timeout(100, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.notEqual('AbortError', e.name)
      }
    })
  })

  describe('wait', function () {
    it('resolves', async function () {
      try {
        await wait(10)
        assert.isOk(true)
      } catch {
        assert.fail('rejected')
      }
    })
    it('resolves before timeout rejects', async function () {
      try {
        await Promise.race([timeout(200), wait(100)])
        assert.isOk(true)
      } catch {
        assert.fail('rejected')
      }
    })
    it('can be canceled immediately', async function () {
      const controller = new AbortController()
      controller.abort()
      try {
        await wait(100, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('can be canceled while waiting', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 50)
      try {
        await wait(200, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('settles if canceled later', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 200)
      try {
        await wait(100, controller.signal)
        assert.isOk(true)
      } catch {
        assert.fail('rejected')
      }
    })
  })

  describe('retry', function () {
    it('succeeds on first attempt', async function () {
      const fn = succeedAfter(1, 42)
      try {
        const value = await retry(fn, 1)
        assert.equal(42, value)
      } catch {
        assert.fail('rejected')
      }
    })

    it('succeeds on second attempt', async function () {
      const fn = succeedAfter(2, 42)
      try {
        const value = await retry(fn, 2)
        assert.equal(42, value)
      } catch {
        assert.fail('rejected')
      }
    })

    it('fails after running out of attempts', async function () {
      const fn = succeedAfter(2, 42)
      try {
        const value = await retry(fn, 1)
        assert.equal(42, value)
        assert.fail('resolved')
      } catch {
        assert.isOk(true)
      }
    })

    it('can be canceled immediately', async function () {
      const fn = () => wait(100)
      const controller = new AbortController()
      controller.abort()
      try {
        await retry(fn, 2, Infinity, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('can be canceled while task is running', async function () {
      const fn = () => wait(200)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)
      try {
        await retry(fn, 2, Infinity, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('can be canceled while waiting to retry', async function () {
      const fn = succeedAfter(2, 42)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)
      try {
        await retry(fn, 2, Infinity, controller.signal)
        assert.fail('resolved')
      } catch (e) {
        assert.equal('AbortError', e.name)
      }
    })

    it('succeeds before cancelation', async function () {
      const fn = succeedAfter(2, 42)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 1500)
      try {
        const value = await retry(fn, 2, Infinity, controller.signal)
        assert.equal(42, value)
      } catch {
        assert.fail('rejected')
      }
    })
  })
})

function succeedAfter(tries, value) {
  let attempt = 1
  return function () {
    return new Promise((resolve, reject) => {
      if (attempt < tries) {
        attempt++
        reject(new Error('failed'))
      } else {
        resolve(value)
      }
    })
  }
}
