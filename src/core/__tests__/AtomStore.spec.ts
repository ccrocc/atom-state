import AtomStore from '../AtomStore'
import createStore from '../../utils/createStore'

const nextTick = () => new Promise(resolve => setImmediate(resolve))

describe('new AtomStore()', () => {
  test('AtomStore can be initialized with empty param', () => {
    const store = new AtomStore()
    expect(store).not.toBeNull()
  })

  test('AtomStore can be initialized with a Map param', () => {
    let atomValues = new Map()
    const store = new AtomStore(atomValues)
    expect(store).not.toBeNull()
  })
})

describe('getAtomValue()', () => {
  test('should return an atom value by key', () => {
    const store = createStore({ foo: 'bar' })
    expect(store.getAtomValue('foo')).toEqual('bar')
  })

  test('should return undefined for a promise atom without fallback and does not return result', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    expect(store.getAtomValue('foo')).toBeUndefined()
  })

  test('should return an fallback value for a promise atom with fallback', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), {
      isAsync: true,
      fallback: 'loading'
    })
    expect(store.getAtomValue('foo')).toBe('loading')
  })

  test('should return the promise value after the promise resolved', async () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    expect(store.getAtomValue('foo')).toBeUndefined()
    await nextTick()
    expect(store.getAtomValue('foo')).toEqual('bar')
  })

  test("should return undefined if key doesn's exist", () => {
    const store = createStore({ foo: 'bar' })
    expect(store.getAtomValue('bar')).toBeUndefined()
  })
})

describe('getAtomPromise()', () => {
  test('should return a promise for a value', () => {
    const store = createStore({ foo: 'bar' })
    expect(store.getAtomPromise('foo') instanceof Promise).toBe(true)
  })

  test('should return a promise for a promise', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    expect(store.getAtomPromise('foo') instanceof Promise).toBe(true)
  })

  test("should return undefined if key doesn's exist", () => {
    const store = createStore()
    expect(store.getAtomPromise('foo1')).toBeUndefined()
  })

  test('should resolve a result', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    expect(store.getAtomPromise('foo')).resolves.toBe('bar')
  })

  test('should reject an error', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.reject('error'))
    expect(store.getAtomPromise('foo')).rejects.toBe('error')
  })

  test('should reject an error with fallback error message', async () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.reject('error'), {
      isAsync: true,
      fallback: () => 'failed'
    })

    await nextTick()
    expect(store.getAtomPromise('foo')).rejects.toEqual('error')
  })
})

describe('setAtomValue()', () => {
  test('should set an atom value', () => {
    const store = createStore({ foo: 'bar' })
    store.setAtomValue('foo', 'new bar')
    expect(store.getAtomValue('foo')).toEqual('new bar')
  })

  test('should override the existed atom value if key exists', () => {
    const store = createStore()
    store.setAtomValue('foo', 'bar')
    store.setAtomValue('foo', 'foo')
    expect(store.getAtomValue('foo')).toBe('foo')
  })

  test('should delete the atom promise after set a new no-promise value', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), {
      isAsync: true,
      fallback: 'loading'
    })
    expect(store.isAtomPromise('foo')).toBe(true)
    store.setAtomValue('foo', 'bar')
    expect(store.getAtomValue('foo')).toBe('bar')
    expect(store.isAtomPromise('foo')).toBe(false)
  })

  test('should add a atom promise after set a new promise value', () => {
    const store = createStore()
    store.setAtomValue('foo', 'bar')
    expect(store.getAtomValue('foo')).toBe('bar')
    expect(store.isAtomPromise('foo')).toBe(false)
    store.setAtomValue('foo', Promise.resolve('bar'), {
      isAsync: true,
      fallback: 'loading'
    })
    expect(store.isAtomPromise('foo')).toBe(true)
    expect(store.getAtomValue('foo')).toBe('loading')
  })
})

describe('subscribeAtom()', () => {
  test('should subscribe the atom value change', async () => {
    const store = createStore({ foo: 'bar' })
    return new Promise(resolve => {
      store.subscribeAtom('foo', value => {
        expect(value).toEqual('new bar')
        resolve()
      })
      store.setAtomValue('foo', 'new bar')
    })
  })

  test('should call lisener once after the atom value change', async () => {
    const mockLisener = jest.fn()
    const store = createStore({ foo: 'bar' })
    store.subscribeAtom('foo', mockLisener)
    store.setAtomValue('foo', 'new bar')

    await nextTick()
    expect(mockLisener.mock.calls.length).toBe(1)
  })
})

describe('unsubscribeAtom()', () => {
  test('should unsubscribe the atom value change', async () => {
    const mockLisener = jest.fn()
    const store = createStore({ foo: 'bar' })
    store.subscribeAtom('foo', mockLisener)
    store.unsubscribeAtom('foo', mockLisener)
    store.setAtomValue('foo', 'new bar')

    await nextTick()
    expect(mockLisener.mock.calls.length).toBe(0)
  })

  test('should unsubscribe a not subscribed key', async () => {
    const store = createStore({ foo: 'bar' })

    const mockLisener = jest.fn()
    store.unsubscribeAtom('foo', mockLisener)
    store.setAtomValue('foo', 'new bar')

    await nextTick()
    expect(mockLisener.mock.calls.length).toBe(0)
  })
})

describe('containsAtom()', () => {
  test('return true if atom exists', () => {
    const store = createStore({ foo: 'bar' })
    expect(store.containsAtom('foo')).toBe(true)
    expect(store.containsAtom('bar')).toBe(false)
  })
})

describe('isAsyncAtom()', () => {
  test('return false for a normal atom', () => {
    const store = createStore({ foo: 'bar' })
    expect(store.isAtomPromise('foo')).toBe(false)
  })

  test('return false for a not exist atom', () => {
    const store = createStore({ foo: 'bar' })
    expect(store.isAtomPromise('bar')).toBe(false)
  })

  test('return true for a sync atom', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve(), { isAsync: true })
    expect(store.isAtomPromise('foo')).toBe(true)
  })
})

describe('_notifyAtomsChange()', () => {
  test('AtomStore notifies changes', async () => {
    let atomValues = new Map([
      ['foo', 'bar'],
      ['bar', 'foo']
    ])

    const mockFooLisener = jest.fn()
    const mockBarLisener = jest.fn()
    const store = new AtomStore(atomValues)
    store.subscribeAtom('foo', mockFooLisener)
    store.subscribeAtom('bar', mockBarLisener)
    store._notifyAtomsChange(['foo', 'bar'])

    await nextTick()
    expect(mockFooLisener.mock.calls.length).toBe(1)
    expect(mockBarLisener.mock.calls.length).toBe(1)
  })
})

describe('setAtomValue() with Promise', () => {
  test('should register an async atom', async () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    expect(store.containsAtom('foo')).toBe(true)
    expect(store.isAtomPromise('foo')).toBe(true)
    expect(store.getAtomValue('foo')).toBeUndefined()

    await nextTick()
    expect(store.getAtomValue('foo')).toBe('bar')
  })

  test('should register an async atom with Promise.reject', async () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.reject('bar'), {
      isAsync: true,
      fallback: (status: any) => status
    })

    expect(store.getAtomValue('foo')).toBe('loading')
    await nextTick()
    expect(store.getAtomValue('foo')).toBe('failed')
  })
})

describe('removeAtom()', () => {
  test('should remove an exist atom', () => {
    const store = createStore({ foo: 'bar' })
    store.removeAtom('foo')
    expect(store.containsAtom('foo')).toBe(false)
  })

  test('should remove an exist atom promise', () => {
    const store = createStore()
    store.setAtomValue('foo', Promise.resolve('bar'), { isAsync: true })
    store.removeAtom('foo')
    expect(store.containsAtom('foo')).toBe(false)
    expect(store.isAtomPromise('foo')).toBe(false)
  })

  test('should not remove a not exist atom', () => {
    const store = createStore()
    store.removeAtom('foo')
    expect(store.containsAtom('foo')).toBe(false)
  })
})
