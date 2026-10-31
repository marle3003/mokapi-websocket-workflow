# Mokapi Collab Demo

A tiny, no-build-step React app showing multi-user document collaboration mocked entirely with [Mokapi](https://mokapi.io) and an AsyncAPI WebSocket spec. No real backend involved.

This is the companion demo for the blog post "How to Test Multi-User Document Collaboration Without a Real Backend."

## What's in here

- `mock/asyncapi.yaml` - the WebSocket contract: a `/doc/{docId}` channel with `presence`, `patch`, and `sync` messages.
- `mock/collab.ts` - a Mokapi Script that holds the shared document state in memory, applies patches,
  rejects stale (conflicting) patches, and sends new joiners the full current document.
- `index.html` - a single-file React app with a textarea, a live user list, and a button to deliberately trigger a version conflict.

## Running it

1. Install Mokapi if you haven't already. See https://mokapi.io/docs/get-started/installation for install options.

2. From this folder, start the mock:

   ```bash
   mokapi
   ```

   You should see a log line confirming a WebSocket server is running at `localhost:8765`.

3. Start simple web server with `node server.ts`

4. Open `http://localhost:4300/index.html` directly in your browser

5. Open it again in a second tab, or a second browser window.

6. In each tab, enter the same doc id (default `demo-doc`) but a different name, and hit Join.

7. Type in one tab's textarea and watch the other tab update in real time. Each tab also shows who's currently connected and the current document version.

## Running the Playwright tests

There's an end to end test suite that actually drives two browser tabs at once against the real Mokapi mock, no mocking of the mock. It covers:

- a client joining late immediately seeing the existing document content
- edits from one client syncing live to another connected client
- a deliberately stale patch getting rejected instead of corrupting the document
- a client disconnecting, missing some edits, then reconnecting and catching up

Setup:

```bash
npm install
npx playwright install chromium
```

Then, in one terminal, start Mokapi (the tests expect it already running):

```bash
mokapi
```

In another terminal, run the tests:

```bash
npm test
```

Run with a visible browser instead of headless:

```bash
npm run test:headed
```