import rateLimit, { type Store } from "express-rate-limit";


export const createApiLimiter = (store?: Store) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { success: false, message: "Too many requests, please try again later." }
})

export const createAuthLimiter = (store?: Store) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: false,
    legacyHeaders: false,
    store,
    message: { success: false, message: "Too many auth attempts, please try again later." }
})

export const createAiLimiter = (store?: Store) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { success: false, message: "Too many AI requests, please try again later." }
})

export const createWebhookLimiter = (store?: Store) => rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { success: false, message: "Too many requests, please try again later." }
})