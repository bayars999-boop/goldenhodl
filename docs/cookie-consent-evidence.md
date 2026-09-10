# Cookie consent audit evidence

The application uses one global consent key, `cookie_preferences`, written as a JSON object:

```json
{"functional":true,"analytics":false,"marketing":false}
```

`ConsentTrackers` runs at the root layout and listens for `goldenhodl-cookie-preferences-updated`. It loads Google Analytics only when `analytics=true` and `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is configured. It loads Meta Pixel only when `marketing=true` and `NEXT_PUBLIC_META_PIXEL_ID` is configured. Otherwise the relevant script is removed and never inserted.

## Browser evidence procedure

1. Clear cookies and Local Storage for the site, then hard refresh.
2. Inspect `document.documentElement.dataset`:
   - `cookieAnalytics="false"`
   - `cookieMarketing="false"`
   - `googleAnalyticsLoaded="false"`
   - `metaPixelLoaded="false"`
3. Inspect DOM for `#google-analytics-script` and `#meta-pixel-script`; both must be absent.
4. Open Cookie preferences, enable Analytics only, save, and confirm only the Google script is present.
5. Reopen preferences, enable Marketing, save, and confirm the Meta script is then present.
6. Reject optional cookies and confirm both scripts are removed and both loaded flags are `false`.
7. Capture the preference JSON, DOM script IDs, root data attributes, and the consent API request as audit evidence.

The absence of provider IDs in an environment is fail-closed: no optional tracker can load even if a preference is true.
