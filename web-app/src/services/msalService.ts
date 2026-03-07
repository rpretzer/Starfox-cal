/**
 * MSAL.js service for Microsoft 365 / Azure AD authentication.
 *
 * Uses the PKCE authorization code flow (recommended for SPAs).
 * Client ID is a build-time env var — not a secret, safe for browser.
 */

import { PublicClientApplication, type AccountInfo, type AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';

const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID as string | undefined;
const REDIRECT_URI = `${window.location.origin}/`;

const GRAPH_SCOPES = [
  'User.Read',
  'Calendars.Read',
  'OnlineMeetings.Read',
] as const;

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (msalInstance) return msalInstance;

  if (!MS_CLIENT_ID) {
    throw new Error('Microsoft 365 integration is not configured. Set VITE_MS_CLIENT_ID in your environment.');
  }

  const instance = new PublicClientApplication({
    auth: {
      clientId: MS_CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: REDIRECT_URI,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
  });

  await instance.initialize();
  msalInstance = instance;
  return instance;
}

export interface MSAccount {
  homeAccountId: string;
  username: string;
  name: string;
}

function toMSAccount(account: AccountInfo): MSAccount {
  return {
    homeAccountId: account.homeAccountId,
    username: account.username,
    name: account.name ?? account.username,
  };
}

/**
 * Sign in with a popup — no full-page redirect.
 * Returns the account and an access token.
 */
export async function msSignIn(): Promise<{ account: MSAccount; accessToken: string }> {
  const msal = await getMsalInstance();
  const result: AuthenticationResult = await msal.loginPopup({
    scopes: [...GRAPH_SCOPES],
  });
  return { account: toMSAccount(result.account), accessToken: result.accessToken };
}

/**
 * Acquire an access token silently; falls back to popup when interaction is required.
 */
export async function msGetToken(): Promise<string> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('Not signed in to Microsoft 365');
  }

  try {
    const result = await msal.acquireTokenSilent({
      scopes: [...GRAPH_SCOPES],
      account: accounts[0],
    });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await msal.acquireTokenPopup({
        scopes: [...GRAPH_SCOPES],
        account: accounts[0],
      });
      return result.accessToken;
    }
    throw err;
  }
}

/**
 * Get the currently signed-in Microsoft account, if any.
 */
export async function msGetAccount(): Promise<MSAccount | null> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();
  return accounts.length > 0 ? toMSAccount(accounts[0]) : null;
}

/**
 * Sign out and clear MSAL cache.
 */
export async function msSignOut(): Promise<void> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();
  if (accounts.length > 0) {
    await msal.logoutPopup({ account: accounts[0] });
  }
}

/**
 * True if MSAL is configured (client ID env var is set).
 */
export function isMSConfigured(): boolean {
  return Boolean(MS_CLIENT_ID);
}
