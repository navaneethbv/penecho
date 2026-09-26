Stripe sandbox/UAT acceptance

- Test key and every touched Stripe object verified livemode=false.
- Two new UAT users; subscription and credit-pack Checkout created through UAT API. Same-key retries reused same orders.
- Backend-only pm_card_visa subscription: actual paid USD 10 invoice and actual Stripe invoice.paid event. Natural webhook delivered first; two manually re-signed replays both returned duplicate=true. Exactly 7,000 subscription credits.
- Paid membership projection returned Plus.
- Actual hosted deepseek-4 call returned OK (9 input, 1 output tokens); charged exactly 1 credit, balance 6,999.
- Cleanup canceled test recurring subscription without proration/invoice, expired both unused Checkout sessions, revoked both UAT sessions, removed private token file.
- Coverage limit: no browser Checkout payment completed; credit-pack successful payment webhook not exercised live. Subscription payment was initiated via backend Stripe subscription API using Checkout-authored customer/metadata, not by completing Checkout UI.
- No live-mode charge, production write, GitHub push, or existing-user modification.
