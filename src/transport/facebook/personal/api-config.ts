/**
 * API shape configuration for the Facebook personal (unofficial) endpoints.
 *
 * IMPORTANT — these routes mirror the long-lived `ajax/mercury/*` endpoints
 * used by browser clients. Meta may change payload expectations at any time.
 * Every field here is OVERRIDABLE at construction time, and live behaviour is
 * NOT verifiable from this repository's test suite (mock-fetch only).
 * First-run in the field must confirm each call against DevTools traffic.
 *
 * This module contains NO evasion logic (no CAPTCHA solving, no fingerprint
 * or identity spoofing). On checkpoint/auth errors the transport PAUSES and
 * notifies the admin — it never retries authentication.
 */

export interface PersonalApiConfig {
  baseUrl: string;
  userAgent: string;
  origin: string;
  referer: string;
  /** Fetch the page that contains the `lsd`/`fb_dtsg` anti-CSRF tokens. */
  lsdPage: string;
  endpoints: {
    sendMessages: string;
    threadInfo: string;
    threadList: string;
    markRead: string;
    userInfo: string;
  };
  /** Poll interval for the long-poll receive loop. */
  pollIntervalMs: number;
}

export const DEFAULT_PERSONAL_API: PersonalApiConfig = {
  baseUrl: 'https://www.facebook.com',
  // Honest UA: identifies as a bot per policy; no fingerprint spoofing.
  userAgent: 'FacebookResponseBotV2/2.0 (personal-account transport; self-hosted automation bot)',
  origin: 'https://www.facebook.com',
  referer: 'https://www.facebook.com/messages/t/',
  lsdPage: 'https://www.facebook.com/home.php',
  endpoints: {
    sendMessages: '/ajax/mercury/send_messages.php',
    threadInfo: '/ajax/mercury/thread_info.php',
    threadList: '/ajax/mercury/threadlist_info.php',
    markRead: '/ajax/mercury/change_thread_unread_state.php',
    userInfo: '/ajax/mercury/contact/userinfo.php',
  },
  pollIntervalMs: 5000,
};
