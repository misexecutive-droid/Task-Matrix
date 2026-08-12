// Builds a client only on first use (not at module load) and memoizes it, throwing if the
// required env var isn't set. Avoids crashing the whole server at startup just because one
// AI provider's key isn't configured yet — the same shape every AI/transcription provider
// module was hand-rolling for its own client.
export const lazyClient = <T>(envVar: string, build: () => T): (() => T) => {
    let client: T | null = null
    return () => {
        if (!process.env[envVar]) throw new Error(`${envVar} is not set`)
        if (!client) client = build()
        return client
    }
}
