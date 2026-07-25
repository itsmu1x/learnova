import type { Request, Response } from 'express';
import {
  buildGithubAuthUrl,
  buildGoogleAuthUrl,
  exchangeGithubCode,
  exchangeGoogleCode,
  parseDuration,
} from '@learnova/auth';
import { BadRequestError } from '@learnova/shared';
import { getEnv, TOKENS, isProduction } from '@learnova/config';
import { sendOk } from '../../core/http/responses.js';
import { authService, type AuthTokens } from './auth.service.js';

function requestMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
  };
}

function setAuthCookies(res: Response, tokens: AuthTokens): void {
  const env = getEnv();
  const secure = isProduction();
  // Cross-origin web ↔ API (e.g. Vercel + Render) needs SameSite=None; Secure.
  const sameSite = secure ? 'none' : 'lax';
  let accessMaxAge = 15 * 60 * 1000;
  let refreshMaxAge = 30 * 24 * 3600 * 1000;
  try {
    accessMaxAge = parseDuration(env.JWT_ACCESS_TTL);
    refreshMaxAge = parseDuration(env.JWT_REFRESH_TTL);
  } catch {
    /* keep defaults */
  }

  res.cookie(TOKENS.ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: accessMaxAge,
    path: '/',
  });
  res.cookie(TOKENS.REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: refreshMaxAge,
    path: '/',
  });
}

function clearAuthCookies(res: Response): void {
  const secure = isProduction();
  const sameSite = secure ? 'none' : 'lax';
  res.clearCookie(TOKENS.ACCESS_COOKIE, { path: '/', secure, sameSite });
  res.clearCookie(TOKENS.REFRESH_COOKIE, { path: '/', secure, sameSite });
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body, requestMeta(req));
    setAuthCookies(res, result);
    sendOk(res, result, 201);
  },

  async registerInstructor(req: Request, res: Response): Promise<void> {
    const result = await authService.registerInstructor(req.body);
    sendOk(res, result, 201);
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body, requestMeta(req));
    setAuthCookies(res, result);
    sendOk(res, result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token =
      (req.cookies as Record<string, string>)?.[TOKENS.REFRESH_COOKIE] ??
      (req.body as { refreshToken?: string })?.refreshToken;
    if (!token) throw new BadRequestError('Missing refresh token');
    const tokens = await authService.refresh(token, requestMeta(req));
    setAuthCookies(res, tokens);
    sendOk(res, tokens);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token =
      (req.cookies as Record<string, string>)?.[TOKENS.REFRESH_COOKIE] ??
      (req.body as { refreshToken?: string })?.refreshToken;
    await authService.logout(token);
    clearAuthCookies(res);
    sendOk(res, { success: true });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.me(req.user!.id);
    sendOk(res, user);
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    await authService.verifyEmail(req.body.token);
    sendOk(res, { verified: true });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.requestPasswordReset(req.body.email);
    sendOk(res, { message: 'If an account exists, a reset link has been sent.' });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    sendOk(res, { message: 'Password updated successfully.' });
  },

  // --- OAuth ---
  googleRedirect(_req: Request, res: Response): void {
    const state = Math.random().toString(36).slice(2);
    res.redirect(buildGoogleAuthUrl(state));
  },

  githubRedirect(_req: Request, res: Response): void {
    const state = Math.random().toString(36).slice(2);
    res.redirect(buildGithubAuthUrl(state));
  },

  async googleCallback(req: Request, res: Response): Promise<void> {
    const code = String(req.query.code ?? '');
    if (!code) throw new BadRequestError('Missing authorization code');
    const profile = await exchangeGoogleCode(code);
    const result = await authService.oauthLogin(profile, requestMeta(req));
    setAuthCookies(res, result);
    res.redirect(`${getEnv().WEB_URL}/oauth/success`);
  },

  async githubCallback(req: Request, res: Response): Promise<void> {
    const code = String(req.query.code ?? '');
    if (!code) throw new BadRequestError('Missing authorization code');
    const profile = await exchangeGithubCode(code);
    const result = await authService.oauthLogin(profile, requestMeta(req));
    setAuthCookies(res, result);
    res.redirect(`${getEnv().WEB_URL}/oauth/success`);
  },
};
