# SpiceSync Admin

Run the canonical content admin from this directory:

```bash
npm install
npm start
```

The server runs at `http://localhost:3456` by default.

## Kink Role Selectors

Kinks use a single topic row. Enable **Show Give / Receive / Both selector** on any kink to show the role selector in the mobile app.

The old two-row `give`/`receive` source model is deprecated. Use **Clean Up Roles** in the Kinks tab to collapse legacy pairs, enable role selectors, and simplify kink descriptions.

Kink edits save to both `kinks.en.json` and `kinks.es.json` so role selector metadata stays aligned across languages.
