# Netlify Edge Function — reverse proxy test

A throwaway test to see whether a Netlify Edge Function can match a Cloudflare
Worker as a path-based reverse proxy that also masks the backend hostname.

## What it does

- `/`, `/shop-all`, `/about`, `/product`, `/blog` → served from Webflow (`wf.rivyl.net`)
- everything else → served from WordPress (`ilmlatest.kinsta.cloud`)
- rewrites the response so the backend hostname stays masked behind the site URL

## Files

- `netlify.toml` — registers the edge function to run on all paths (`/*`)
- `netlify/edge-functions/router.js` — the routing + rewrite logic

## Deploy

Connect this repo to Netlify (New site from Git). Netlify builds and registers
the edge function automatically. Drag-and-drop does NOT work for edge functions.

Test on the assigned `*.netlify.app` URL. Nothing here touches rivyl.net, its DNS,
or the live Cloudflare setup.
