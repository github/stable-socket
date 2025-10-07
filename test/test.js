import {describe, it, expect} from 'vitest'
import {retry, timeout, wait} from '../src/async-tasks.ts'
import {StableSocket} from '../src/index.ts'

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
    expect(socket.isOpen()).toBe(true)
    expect(delegate.states).toEqual(['open'])
    socket.send('echo:hello')
    await wait(10)
    socket.close()
    expect(delegate.states).toEqual(['open', 'msg:hello', 'closed', 'finished'])
  })

  it('retries on non-fatal close code', async function () {
    const url = 'ws://localhost:7999'
    const delegate = new Delegate(0)
    const policy = {timeout: 100, attempts: 1, maxDelay: 100}
    const socket = new StableSocket(url, delegate, policy)
    await socket.open()
    expect(socket.isOpen()).toBe(true)
    expect(delegate.states).toEqual(['open'])
    socket.send('close:1000')
    await wait(200)
    expect(delegate.states).toEqual(['open', 'closed', 'open'])
    socket.close()
  })

  it('does not retry on fatal close code', async function () {
    const url = 'ws://localhost:7999'
    const delegate = new Delegate(4000)
    const policy = {timeout: 100, attempts: 1, maxDelay: 100}
    const socket = new StableSocket(url, delegate, policy)
    await socket.open()
    expect(socket.isOpen()).toBe(true)
    expect(delegate.states).toEqual(['open'])
    socket.send('close:4000')
    await wait(200)
    expect(delegate.states).toEqual(['open', 'closed', 'finished'])
  })
})

describe('async-tasks', function () {
  describe('timeout', function () {
    it('rejects', async function () {
      await expect(timeout(10)).rejects.toThrow()
    })
    it('rejects before wait resolves', async function () {
      await expect(Promise.race([timeout(100), wait(200)])).rejects.toThrow()
    })
    it('can be canceled immediately', async function () {
      const controller = new AbortController()
      controller.abort()
      try {
        await timeout(100, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('can be canceled while waiting', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 50)
      try {
        await timeout(200, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('settles if canceled later', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 200)
      try {
        await timeout(100, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).not.toBe('AbortError')
      }
    })
  })

  describe('wait', function () {
    it('resolves', async function () {
      await expect(wait(10)).resolves.toBeUndefined()
    })
    it('resolves before timeout rejects', async function () {
      await expect(Promise.race([timeout(200), wait(100)])).resolves.toBeUndefined()
    })
    it('can be canceled immediately', async function () {
      const controller = new AbortController()
      controller.abort()
      try {
        await wait(100, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('can be canceled while waiting', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 50)
      try {
        await wait(200, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('settles if canceled later', async function () {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 200)
      await expect(wait(100, controller.signal)).resolves.toBeUndefined()
    })
  })

  describe('retry', function () {
    it('succeeds on first attempt', async function () {
      const fn = succeedAfter(1, 42)
      const value = await retry(fn, 1)
      expect(value).toBe(42)
    })

    it('succeeds on second attempt', async function () {
      const fn = succeedAfter(2, 42)
      const value = await retry(fn, 2)
      expect(value).toBe(42)
    })

    it('fails after running out of attempts', async function () {
      const fn = succeedAfter(2, 42)
      await expect(retry(fn, 1)).rejects.toThrow()
    })

    it('can be canceled immediately', async function () {
      const fn = () => wait(100)
      const controller = new AbortController()
      controller.abort()
      try {
        await retry(fn, 2, Infinity, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('can be canceled while task is running', async function () {
      const fn = () => wait(200)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)
      try {
        await retry(fn, 2, Infinity, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('can be canceled while waiting to retry', async function () {
      const fn = succeedAfter(2, 42)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)
      try {
        await retry(fn, 2, Infinity, controller.signal)
        expect.fail('resolved')
      } catch (e) {
        expect(e.name).toBe('AbortError')
      }
    })

    it('succeeds before cancelation', async function () {
      const fn = succeedAfter(2, 42)
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 1500)
      const value = await retry(fn, 2, Infinity, controller.signal)
      expect(value).toBe(42)
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
