import { createClient } from "redis";
import { RedisStore } from "rate-limit-redis"
import { env } from "./env.js"

const reconnectStrategy = ( retries : number) => {
    if(retries > 5 ) return new Error("Redis unreachable after 5 attemps - giving up.")
    return Math.min(retries * 200, 2000)
}

export const createRedisPubSubClients = async () => {
    const pubClient = createClient({ url : env.REDIS_URL , socket : { reconnectStrategy }});
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => console.error("Redis pub client error:" , err))
    subClient.on("error", (err) => console.error("Redis sub client error : ", err))

    await Promise.all([pubClient.connect(), subClient.connect()]);
    return { pubClient, subClient}
}

export const createRedisRateLimitStore = async () => {
    const client = createClient({ url : env.REDIS_URL , socket : { reconnectStrategy}})
    client.on("error" , (err) => console.error("Redis rate-limit client error:", err.message ))
    await client.connect();

    return new RedisStore({
        sendCommand : (...args : string[]) => client.sendCommand(args)
    })
}