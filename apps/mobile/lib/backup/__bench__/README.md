# Backup key-derivation timing

`PBKDF2_ITERATIONS` (210k, `../backupCrypto.ts`) is a deliberate
cost/security trade-off. It is stored per-envelope, so raising it later stays
backward-compatible with existing backups — but lowering it below
`MIN_ACCEPTED_ITERATIONS` would reject them.

## Measurements so far

| Environment | 100k | 210k |
|---|---|---|
| Node 24 / V8 (M-series Mac) | 107ms | 220ms |
| Jest (instrumented, same Mac) | ~430ms | ~880ms |
| Hermes / real device | **not yet measured** | **not yet measured** |

Jest runs ~4x slower than plain V8 here, so treat its numbers as an upper
bound rather than a device estimate.

## Measuring on-device

The number that matters is Hermes on the oldest supported iPhone, since key
derivation blocks the backup and restore buttons. To capture it, temporarily
log around the call in `createBackup` / `restoreBackup`:

```ts
const t = Date.now();
const backup = await createBackup();
console.log('createBackup ms', Date.now() - t);
```

Run a release build (Hermes is much slower in dev with the debugger
attached), and read the timing from the device log.

## Acting on the result

- Under ~1s: leave as is; the existing spinner covers it.
- 1-3s: keep 210k but make the progress state more explicit than a spinner.
- Over ~3s: consider lowering to 120k-150k, still above OWASP's floor, and
  document the trade-off here.
