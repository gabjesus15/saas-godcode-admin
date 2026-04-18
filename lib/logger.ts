export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  companyId?: string;
  userId?: string;
  requestId?: string;
  path?: string;
  [key: string]: unknown;
}

/** Crea un contexto base para trazar una peticion. */
export function createRequestContext(path?: string, method?: string, tag?: string): LogContext {
  return {
    path,
    method,
    tag,
    requestId: Math.random().toString(36).substring(7),
  };
}

/** Inicia un cronometro para medir latencia. */
export function startTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}

export interface Logger {
  info: (message: string, ...args: LogContext[]) => void;
  warn: (message: string, ...args: LogContext[]) => void;
  error: (message: string, ...args: LogContext[]) => void;
  debug: (message: string, ...args: LogContext[]) => void;
  log: (level: LogLevel, message: string, context?: LogContext) => void;
}

export const logger: Logger = {
  info(message: string, ...contexts: LogContext[]) {
    this.log("info", message, Object.assign({}, ...contexts));
  },
  warn(message: string, ...contexts: LogContext[]) {
    this.log("warn", message, Object.assign({}, ...contexts));
  },
  error(message: string, ...contexts: LogContext[]) {
    this.log("error", message, Object.assign({}, ...contexts));
  },
  debug(message: string, ...contexts: LogContext[]) {
    this.log("debug", message, Object.assign({}, ...contexts));
  },
  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (process.env.NODE_ENV === "development") {
      const color = level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[32m";
      console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, context || "");
    } else {
      console.log(JSON.stringify(payload));
    }
  },
};
