import { describe, expect, it } from 'vitest'
import {
  createLogger,
  describeError,
  registerGlobalErrorHandlers,
  type GlobalErrorEventLike,
  type LogEntry,
} from './logger'

function createFixedClock(iso: string): () => Date {
  return () => new Date(iso)
}

function createSilentLogger(options: { maxEntries?: number } = {}) {
  return createLogger({
    ...options,
    now: createFixedClock('2026-07-30T12:00:00.000Z'),
    sink: () => {},
  })
}

type FakeTarget = {
  addEventListener(
    type: 'error' | 'unhandledrejection',
    listener: (event: GlobalErrorEventLike) => void
  ): void
  removeEventListener(
    type: 'error' | 'unhandledrejection',
    listener: (event: GlobalErrorEventLike) => void
  ): void
  emit(type: 'error' | 'unhandledrejection', event: GlobalErrorEventLike): void
  listenerCount(type: 'error' | 'unhandledrejection'): number
}

function createFakeTarget(): FakeTarget {
  const listeners = new Map<string, ((event: GlobalErrorEventLike) => void)[]>()

  return {
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener])
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((current) => current !== listener)
      )
    },
    emit(type, event) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event)
      }
    },
    listenerCount(type) {
      return (listeners.get(type) ?? []).length
    },
  }
}

describe('describeError', () => {
  it('preserves name, message and stack of a real Error', () => {
    const error = new TypeError('preço ausente')

    expect(describeError(error)).toMatchObject({
      name: 'TypeError',
      message: 'preço ausente',
    })
    expect(describeError(error).stack).toBeTypeOf('string')
  })

  it('accepts a thrown string without a stack', () => {
    expect(describeError('falha bruta')).toEqual({
      name: 'UnknownError',
      message: 'falha bruta',
    })
  })

  it('serializes non-error values', () => {
    expect(describeError({ code: 42 })).toEqual({
      name: 'UnknownError',
      message: '{"code":42}',
    })
  })

  it('never throws on values that cannot be serialized', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(describeError(circular)).toEqual({
      name: 'UnknownError',
      message: 'unknown',
    })
  })

  it('falls back to a stable message for undefined', () => {
    expect(describeError(undefined)).toEqual({
      name: 'UnknownError',
      message: 'unknown',
    })
  })
})

describe('createLogger', () => {
  it('records level, message, timestamp and context', () => {
    const logger = createSilentLogger()

    logger.error('Falha ao carregar preços.', { scope: 'Carteira' })

    expect(logger.entries()).toEqual<LogEntry[]>([
      {
        level: 'error',
        message: 'Falha ao carregar preços.',
        occurredAt: '2026-07-30T12:00:00.000Z',
        context: { scope: 'Carteira' },
      },
    ])
  })

  it('omits the context key when none is given', () => {
    const logger = createSilentLogger()

    logger.info('Aplicação iniciada.')

    expect(logger.entries()[0]).not.toHaveProperty('context')
  })

  it('keeps only the most recent entries within the limit', () => {
    const logger = createSilentLogger({ maxEntries: 2 })

    logger.info('primeira')
    logger.warn('segunda')
    logger.error('terceira')

    expect(logger.entries().map((entry) => entry.message)).toEqual([
      'segunda',
      'terceira',
    ])
  })

  it('forwards every entry to the sink', () => {
    const received: LogEntry[] = []
    const logger = createLogger({
      now: createFixedClock('2026-07-30T12:00:00.000Z'),
      sink: (entry) => received.push(entry),
    })

    logger.warn('câmbio desatualizado')

    expect(received).toHaveLength(1)
    expect(received[0].level).toBe('warn')
  })

  it('does not propagate a failing sink', () => {
    const logger = createLogger({
      now: createFixedClock('2026-07-30T12:00:00.000Z'),
      sink: () => {
        throw new Error('sink quebrado')
      },
    })

    expect(() => logger.error('falha real')).not.toThrow()
    expect(logger.entries()).toHaveLength(1)
  })

  it('clears the buffer on demand', () => {
    const logger = createSilentLogger()

    logger.info('primeira')
    logger.clear()

    expect(logger.entries()).toEqual([])
  })
})

describe('registerGlobalErrorHandlers', () => {
  it('records uncaught errors with source and line', () => {
    const target = createFakeTarget()
    const logger = createSilentLogger()

    registerGlobalErrorHandlers(target, logger)
    target.emit('error', {
      error: new Error('boom'),
      filename: 'https://app/assets/index.js',
      lineno: 12,
    })

    expect(logger.entries()[0]).toMatchObject({
      level: 'error',
      message: 'Erro não capturado na aplicação.',
      context: {
        name: 'Error',
        detail: 'boom',
        source: 'https://app/assets/index.js',
        line: 12,
      },
    })
  })

  it('falls back to the event message when no error object is given', () => {
    const target = createFakeTarget()
    const logger = createSilentLogger()

    registerGlobalErrorHandlers(target, logger)
    target.emit('error', { message: 'Script error.' })

    expect(logger.entries()[0].context).toMatchObject({
      detail: 'Script error.',
    })
  })

  it('records unhandled promise rejections', () => {
    const target = createFakeTarget()
    const logger = createSilentLogger()

    registerGlobalErrorHandlers(target, logger)
    target.emit('unhandledrejection', { reason: new Error('sessão expirada') })

    expect(logger.entries()[0]).toMatchObject({
      message: 'Promise rejeitada sem tratamento.',
      context: { detail: 'sessão expirada' },
    })
  })

  it('unregisters both listeners', () => {
    const target = createFakeTarget()
    const logger = createSilentLogger()

    const unregister = registerGlobalErrorHandlers(target, logger)
    unregister()
    target.emit('error', { message: 'ignorado' })

    expect(target.listenerCount('error')).toBe(0)
    expect(target.listenerCount('unhandledrejection')).toBe(0)
    expect(logger.entries()).toEqual([])
  })
})
