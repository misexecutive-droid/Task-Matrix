import { Settings } from "../../models/Settings.js"
// import type { UpdateSettingsInput } from "./settings.validation.js"

// In-memory cache of the single Settings document. Anything that needs settings synchronously
// (e.g. building a multer instance per upload request, see config/upload.ts) reads this cache
// instead of hitting the database on every request. Refreshed on init() and every update().
let cache: any = null;

const loadOrCreate = async () => {
    const existing = await Settings.findOne();
    return existing ?? Settings.create({});
};

export const settingsService = {
    // Called once at server startup (see server.ts) so the cache is populated before the app
    // starts accepting requests — everything downstream assumes getCached() always has a value.
    async init() {
        cache = await loadOrCreate();
        return cache;
    },

    // Synchronous read of whatever's currently cached. Used by code that can't await a DB call
    // mid-request, like upload.ts building multer's limits object fresh on every upload.
    getCached() {
        if (!cache) throw new Error("Settings accessed before settingsService.init() ran");
        return cache;
    },

    async get() {
        if (!cache) await this.init();
        return cache;
    },

    async update(input: UpdateSettingsInput) {
        cache = await Settings.findOneAndUpdate({}, input, { new: true, upsert: true });
        return cache;
    },
};
