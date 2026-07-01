/**
 * Worker fixture that intentionally does NOT call `SyncChannel.listen()`.
 * Used by `00-connect-failure.test.ts` to verify that `SyncChannel.connect`
 * returns a `TimeoutError` instead of hanging forever when the worker never
 * signals readiness.
 */
// Deliberately empty — no SyncChannel.listen() call.
