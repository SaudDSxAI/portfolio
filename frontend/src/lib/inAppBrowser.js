// Detects the "mini browser" that social apps open links in (LinkedIn,
// Instagram, Facebook, X, TikTok, etc). These are real Chrome/Safari engines
// under the hood, but the host app controls what web APIs are exposed —
// and every one of them either strips getUserMedia entirely or blocks it
// with no permission prompt at all, silently. That's not a bug in this site;
// there is no web-page-level fix for a permission the wrapper app refuses to
// ask for. The only real fix is getting the user into their actual browser.
//
// Two independent signals, checked separately because either can catch cases
// the other misses:
//   1. UA sniffing — catches it before we even try, so we can show the
//      explainer up front instead of after a confusing silent failure.
//   2. Feature detection (no mediaDevices.getUserMedia at all) — catches
//      any in-app browser we didn't think to name, or a future UA change.

const IN_APP_PATTERNS = [
  { name: 'LinkedIn', re: /LinkedInApp/i },
  { name: 'Instagram', re: /Instagram/i },
  { name: 'Facebook', re: /FBAN|FBAV|FB_IAB/i },
  { name: 'X (Twitter)', re: /Twitter/i },
  { name: 'TikTok', re: /musical_ly|TikTok/i },
  { name: 'Snapchat', re: /Snapchat/i },
  { name: 'WeChat', re: /MicroMessenger/i },
  { name: 'Line', re: /\bLine\//i },
];

export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return { isInApp: false, name: null };
  const ua = navigator.userAgent || '';

  const matched = IN_APP_PATTERNS.find((p) => p.re.test(ua));
  const noMicApi = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;

  return {
    isInApp: !!matched || noMicApi,
    name: matched ? matched.name : noMicApi ? 'an in-app browser' : null,
    isAndroid: /Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
  };
}

// Best-effort Android hand-off to Chrome via an intent URL. Works in a
// meaningful share of Android in-app webviews (LinkedIn's included, on most
// versions); there is no equivalent trick on iOS since Apple doesn't let a
// webview relaunch a URL in Safari programmatically — iOS users are told to
// use the browser's own "open in Safari" option instead.
export function tryOpenInAndroidChrome() {
  const bare = window.location.href.replace(/^https?:\/\//, '');
  window.location.href = `intent://${bare}#Intent;scheme=https;package=com.android.chrome;end`;
}
