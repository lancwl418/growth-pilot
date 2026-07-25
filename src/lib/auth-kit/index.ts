/**
 * IdeaMax shared login conventions — authoritative source.
 *
 * This module is framework-free (no next-auth import) so the same file works
 * in every consumer regardless of its NextAuth version (v4 or v5 beta).
 * Consumers vendor a copy at `src/lib/auth-kit/index.ts` via ../sync.sh —
 * edit HERE, then run sync.sh; never edit the vendored copies.
 *
 * Conventions shared by all IdeaMax apps:
 * - One company-wide Google OAuth client ("ideamax-shared-login", Internal
 *   consent screen) — each app registers its own redirect URI on that
 *   client and reuses the same client id/secret.
 * - Sign-in is restricted to the company Google Workspace domain.
 * - The executive allowlist gates the admin view: being able to log in
 *   does NOT grant access to executive dashboards.
 */

export const COMPANY_DOMAIN = "idea-max.com";

/** Default executive allowlist; override with the EXEC_ALLOWLIST env var. */
export const DEFAULT_EXEC_ALLOWLIST: readonly string[] = [
  "rock@idea-max.com",
  "info@idea-max.com",
  "thad@idea-max.com",
];

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function isCompanyEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return Boolean(normalized?.endsWith(`@${COMPANY_DOMAIN}`));
}

export type GoogleProfileCheck = {
  email?: string | null;
  /** Google Workspace hosted-domain claim; absent on personal accounts. */
  hd?: string | null;
  email_verified?: boolean | null;
};

/**
 * Gate for the NextAuth `signIn` callback on Google sign-ins.
 * Requires a verified company-domain email AND the Workspace `hd` claim,
 * so personal Gmail accounts (which never carry `hd`) are always rejected.
 */
export function isAllowedGoogleProfile(profile: GoogleProfileCheck): boolean {
  if (!isCompanyEmail(profile.email)) return false;
  if (profile.hd?.toLowerCase() !== COMPANY_DOMAIN) return false;
  if (profile.email_verified === false) return false;
  return true;
}

/** Parse a comma-separated email list (the EXEC_ALLOWLIST env var format). */
export function parseAllowlist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter((entry): entry is string => Boolean(entry));
}

/** Resolve the executive allowlist from EXEC_ALLOWLIST, falling back to the default. */
export function getExecAllowlist(raw: string | null | undefined): string[] {
  const parsed = parseAllowlist(raw);
  return parsed.length > 0 ? parsed : [...DEFAULT_EXEC_ALLOWLIST];
}

/** Whether this email may enter executive-only surfaces (e.g. admin-view). */
export function isExecutive(
  email: string | null | undefined,
  allowlistRaw?: string | null,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getExecAllowlist(allowlistRaw).includes(normalized);
}

export type SsoCookieConfig = {
  name: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    path: "/";
    secure: boolean;
    domain: string;
  };
};

/**
 * Shared-session (SSO) cookie for apps served under the same parent domain.
 *
 * Returns null unless a cookie domain is configured (env SSO_COOKIE_DOMAIN,
 * e.g. ".idea-max.com") — so apps behave exactly as before until their
 * custom domain is actually live. Do NOT set the env var while an app is
 * still served from onrender.com / vercel.app: browsers reject cookies whose
 * domain doesn't match the site, which would break login.
 *
 * Participating apps MUST share the same AUTH_SECRET: Auth.js derives the
 * JWT encryption key from (secret, cookie name), so an identical name and
 * secret make sessions mutually readable across apps.
 *
 * The cookie name is deliberately NOT the Auth.js default
 * (authjs.session-token), so apps that have not joined SSO yet (Hub,
 * growth-pilot) never receive a colliding cookie that could disturb their
 * own sessions once they move under *.idea-max.com.
 */
export function getSsoCookieConfig(
  cookieDomain: string | null | undefined,
  useSecureCookies: boolean,
): SsoCookieConfig | null {
  const domain = cookieDomain?.trim();
  if (!domain) return null;
  return {
    name: `${useSecureCookies ? "__Secure-" : ""}ideamax.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: useSecureCookies,
      domain,
    },
  };
}
