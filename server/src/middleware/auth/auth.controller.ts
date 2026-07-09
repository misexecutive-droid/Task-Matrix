import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const REFRESH_COOKIE = 'refreshToken';

const cookeiOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/auth',
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
} as const;

const sendAuthResponse = (res: Response, result: { accessToken: string; refreshToken: string; user: unknown }) => {
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookeiOptions);
    res.json({ accessToken: result.accessToken, user: result.user });
};

export const authController = {
    login: asyncHandler(async (req: Request, res: Response) => {
        const input = loginSchema.parse(req.body);
        const result = await authService.login(input);
        sendAuthResponse(res, result);
    }),

    refresh: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
        sendAuthResponse(res, result);
    }),

    logout: asyncHandler(async (req: Request, res: Response) => {
        await authService.logout(req.cookies?.[REFRESH_COOKIE]); 
        res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
        res.json({ success: true });
    })
}; 