const DEFAULT_MAX_ENTRIES = 50

export type LogLevel = 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>

export type LogEntry = {
  level: LogLevel
  message: string
  occurredAt: string
  context?: LogContext
}

export type ErrorDescription = {
  name: string
  message: string
  stack?: string
}

export type Logger = {
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  entries(): readonly LogEntry[]
  clear(): void
}

export type LoggerOptions = {
  maxEntries?: number
  now?: () => Date
  sink?: (entry: LogEntry) => void
}

/**
 * Normaliza qualquer valor lançado em uma descrição estável.
 * Nunca lança, mesmo diante de objetos exóticos.
 */
export function describeError(error: unknown): ErrorDescription {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    }
  }

  if (typeof error === 'string') {
    return { name: 'UnknownError', message: error }
  }

  try {
    return { name: 'UnknownError', message: JSON.stringify(error) ?? 'unknown' }
  } catch {
    return { name: 'UnknownError', message: 'unknown' }
  }
}

function defaultSink(entry: LogEntry): void {
  const payload = entry.context
    ? [entry.message, entry.context]
    : [entry.message]

  if (entry.level === 'error') {
    console.error(...payload)
    return
  }

  if (entry.level === 'warn') {
    console.warn(...payload)
    return
  }

  console.info(...payload)
}

/**
 * Logger em memória, sem dependência externa e sem envio para terceiros.
 * O buffer é limitado e serve para diagnóstico local — nunca deve receber
 * segredo, credencial ou valor financeiro identificável do usuário.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES
  const now = options.now ?? (() => new Date())
  const sink = options.sink ?? defaultSink
  let buffer: LogEntry[] = []

  function record(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): void {
    const entry: LogEntry = {
      level,
      message,
      occurredAt: now().toISOString(),
      ...(context ? { context } : {}),
    }

    buffer = [...buffer, entry].slice(-maxEntries)

    try {
      sink(entry)
    } catch {
      // Um sink quebrado nunca pode derrubar o fluxo que estava sendo registrado.
    }
  }

  return {
    info: (message, context) => record('info', message, context),
    warn: (message, context) => record('warn', message, context),
    error: (message, context) => record('error', message, context),
    entries: () => buffer,
    clear: () => {
      buffer = []
    },
  }
}

export const appLogger = createLogger()

export type GlobalErrorEventLike = {
  message?: string
  error?: unknown
  filename?: string
  lineno?: number
  reason?: unknown
}

export type GlobalErrorTarget = {
  addEventListener(
    type: 'error' | 'unhandledrejection',
    listener: (event: GlobalErrorEventLike) => void
  ): void
  removeEventListener(
    type: 'error' | 'unhandledrejection',
    listener: (event: GlobalErrorEventLike) => void
  ): void
}

/**
 * Registra os dois canais de falha que escapam de qualquer error boundary:
 * exceção não capturada e promise rejeitada sem tratamento.
 * Retorna a função que desfaz o registro.
 */
export function registerGlobalErrorHandlers(
  target: GlobalErrorTarget,
  logger: Logger = appLogger
): () => void {
  function handleError(event: GlobalErrorEventLike): void {
    const described = describeError(event.error ?? event.message)

    logger.error('Erro não capturado na aplicação.', {
      name: described.name,
      detail: described.message,
      ...(described.stack ? { stack: described.stack } : {}),
      ...(event.filename ? { source: event.filename } : {}),
      ...(typeof event.lineno === 'number' ? { line: event.lineno } : {}),
    })
  }

  function handleRejection(event: GlobalErrorEventLike): void {
    const described = describeError(event.reason)

    logger.error('Promise rejeitada sem tratamento.', {
      name: described.name,
      detail: described.message,
      ...(described.stack ? { stack: described.stack } : {}),
    })
  }

  target.addEventListener('error', handleError)
  target.addEventListener('unhandledrejection', handleRejection)

  return () => {
    target.removeEventListener('error', handleError)
    target.removeEventListener('unhandledrejection', handleRejection)
  }
}
