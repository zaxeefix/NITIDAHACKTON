# Offline and backup demonstration plan

1. Load the app and Judge Mode while online.
2. Disconnect the network and confirm the visible Offline state.
3. Submit a synthetic report; record its `TNG-LOCAL-*` reference and original UTC timestamp.
4. Inspect Offline Queue; confirm no external routing occurs.
5. Reconnect and trigger sync. Confirm one server incident uses the same stable reference.
6. Retry and confirm idempotency prevents a duplicate.
7. Demonstrate safe stop by forcing one failed item; later items must remain queued.

Backup assets are the checked-in dataset, model/OCR evaluations, screenshots and demo script. Fresh-laptop check: Node 22+, `npm.cmd install`, copy local env, local setup, dev server, Judge Mode, test, restart and repeat one offline submission.
