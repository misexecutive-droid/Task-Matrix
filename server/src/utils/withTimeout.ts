// SDK-agnostic timeout wrapper — races a promise against a timer instead of relying on each AI
// SDK's own (often very long, e.g. 10 minutes) default request timeout. Used to bound how long a
// single AI provider call can hang before the ensemble in task.ai.service.ts treats it as failed.
export const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timer: NodeJS.Timeout
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}
