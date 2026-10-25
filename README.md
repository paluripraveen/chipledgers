# ChipLedgers

A poker home-game tracker: buy-ins, cash-outs, who owes whom, stats across the season, and live odds on every player's phone.

Live at **https://chipledgers.web.app**

## Features

**Game tracking** (behind the app login)

- **Groups and players**: keep a roster of players and organise them into home-game groups.
- **Live sessions**: record buy-ins and re-buys as the night goes, then chips returned at the end. Each player's net is worked out automatically.
- **Session summary**: the final results for the night.
- **Import**: photograph a handwritten tally sheet and read it into a session with Google Cloud Vision.
- **Settle up** (Admin, PIN-protected): outstanding balances, record payments, settlement history, manage sessions and players, and archive a season.
- **Stats**: leaderboard and per-player history for the group.
- **Season awards**: awards for the current season or all time, with a copyable recap.

**Live Odds** (open to anyone with a table code, no login)

- The host starts a table and shares a 6-character code or QR code. Everyone joins from their own phone.
- Players tap in their own two cards; the host taps in the flop, turn and river.
- Each phone shows only its owner's hand and **outs** (cards that improve it, with the chance by the next card and by the river).
- **Win / tie / lose %** against the real hands is held back during multiplayer hands, so nobody can fold on it. The host taps **Reveal hands** at all-in or showdown to show every live hand and its true win % to the whole table. A host setting can show win % during the hand for practice or friendly games.
- A table with one player is a practice table: hand and outs only.
- **Clear for next hand** reuses the same table for the next hand.

## Tech stack

- React 19, React Router 7, Vite, Tailwind CSS 4
- Firebase: Firestore, Hosting, Anonymous Auth (Live Odds only), Cloud Functions (2nd gen, Node 22)
- Recharts for stats, qrcode for table invites

## Project layout

```
src/
  pages/          one file per screen (lazy-loaded)
  components/     shared UI, incl. the playing card and card picker
  store/          Firestore reads and writes, one module per collection
  utils/awards.js season award calculations
functions/
  poker.js        hand evaluator, equity (exact or simulated) and outs; also used by the web app
  table.js        what each Live Odds player may see
  index.js        tableOdds Cloud Function (Firestore trigger, us-south1)
firestore.rules   security rules; Live Odds hole cards are readable only by their owner
```

## Local development

Requires Node 22+ and Java 21+ (for the Firebase emulators).

```sh
npm install
npm install --prefix functions
cp .env.example .env        # fill in the Firebase web config
npm run emulate             # Auth, Firestore and Functions emulators (project demo-chipledgers)
npm run dev                 # in a second terminal
```

In development the app connects to the local emulators, never to production. `.env` should use the `demo-chipledgers` project ID so the Functions emulator fires its triggers.

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_*` | Firebase web app config |
| `VITE_ADMIN_PIN` | PIN for the Admin / Settle Up page |

## Tests

```sh
npm test --prefix functions   # poker engine and Live Odds table logic
npm run lint
```

## Deploying

```sh
npm run build
firebase deploy --project chipledgers
```

Use `--only hosting`, `--only functions` or `--only firestore:rules` to deploy one part. The project must be on the Blaze plan (for Cloud Functions) with Anonymous sign-in enabled in Firebase Authentication.
