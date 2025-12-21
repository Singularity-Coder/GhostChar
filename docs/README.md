<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ah_8xmbVWsM3zrUD3rkZubNg4GiyMSo1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Favicon

- Browser tab and shortcuts use `public/favicon.svg`, which matches the nav bar app icon.
- Safari pinned tabs use `public/safari-pinned-tab.svg` tinted with `color="#6366f1"`.
- Both are referenced from `index.html` with root-relative paths (`/favicon.svg`), which Vite rewrites with the configured `base` for production. Update the SVGs in `public/` if you change the branding.
