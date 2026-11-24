# CivicTax Gateway HMAC Security

## Recommended Architecture

Keep a dedicated Apex REST authentication component separate from property and
other business services. `CivicTaxGatewayAuth` verifies each backend-signed
request before `CivicTaxRestResource` dispatches it. Deploy the verifier,
`CivicTax_Gateway_Config__c`, and its provisioning interface together in one
managed-package namespace. Store the active and time-limited previous HMAC keys
in a Protected hierarchy custom setting. The package-owned Apex provisioning
path must require an authorized setup administrator and must never return the
stored values.

The current Salesforce DX project has an empty namespace and the target
Developer Edition org reports Public visibility. Salesforce treats Protected
custom settings in an unmanaged package as Public; therefore the existing
`Shared_Secret__c` record is not a production secret boundary. Do not provision
or rotate a production key there. The local metadata remains Public to match
the current org; metadata validation does not package it or protect its data.

Protected visibility is namespace isolation, not encryption at rest and not
protection from trusted Apex in the same package. Minimize same-namespace code,
administer package access carefully, and do not log configuration values.
Public custom settings are readable across namespaces through Apex and may be
API-readable when users have the relevant custom-setting access. A Text field
does not encrypt its value.

Salesforce Named Credentials and External Credentials securely manage
credentials for **outbound Apex callouts**. Apex callout code uses the named
credential; it does not receive the credential secret as arbitrary plaintext
for an inbound HMAC verifier. An encrypted custom field can provide encryption
at rest and field-level controls where the org has the appropriate Salesforce
features, but privileged Apex and users with encrypted-data access can still
read it. Neither option replaces the package boundary required for this HMAC
key. Named Credentials remain appropriate for Apex-initiated outbound
integrations, not this inbound REST signature check.

## Signed Request and Replay Protection

The backend sends `X-CivicTax-Key-Id`, `X-CivicTax-Nonce`,
`X-CivicTax-User-Id`, `X-CivicTax-Timestamp`, and
`X-CivicTax-Signature`. The HMAC-SHA256 canonical message, joined with newline
characters, is:

1. Unix timestamp in seconds
2. Key ID
3. 256-bit random nonce, base64url encoded
4. Authenticated CivicTax user ID
5. Uppercase HTTP method
6. Exact Apex REST endpoint path
7. Exact request body (empty for requests without a body)

The verifier rejects malformed signatures, unknown key IDs, timestamps more
than five minutes from Salesforce time, and nonce reuse. After signature
verification, it atomically inserts a SHA-256 hash of `(key ID, user ID, nonce)`
into `CivicTax_Gateway_Nonce__c`. A unique field enforces replay rejection even
for concurrent duplicate requests. The private ledger contains only hashes and
expiry timestamps, not the signature or HMAC key. `CivicTaxGatewayNonceCleanup`
deletes expired rows; schedule it daily as part of managed-package setup.
Failure to record a nonce fails the request closed.

The backend and Apex protocol versions must be deployed together. The new
headers are mandatory; there is no unsigned or replayable legacy fallback.

## Key Generation, Provisioning, Rotation, and Revocation

- Generate a unique key from a cryptographically secure random-number
  generator, at least 32 random bytes, and encode it for environment-variable
  storage. Generate a separate non-secret key ID. Do not put generated values
  in source control, shell history, tickets, build logs, telemetry, debug logs,
  or chat.
- Provision the key directly into the protected package configuration through
  the package-owned administrator setup path, and into Render's secret manager
  as `CIVICTAX_GATEWAY_SHARED_SECRET`; set `CIVICTAX_GATEWAY_KEY_ID` in Render.
  Never return the secret from the setup API or display it after save.
- To rotate, generate a new key and ID. Atomically set the new pair as active
  and the old pair as previous with an explicit expiry. Update Render to the
  new pair while both IDs are accepted. After all backend instances have
  switched and the overlap exceeds the five-minute request window plus
  deployment/clock-skew margin, remove the previous pair. Keep the overlap
  bounded and monitor only sanitized authentication outcomes.
- To revoke immediately, remove the affected key from the accepted key ring,
  remove it from Render, and reject that key ID. If compromise is suspected,
  skip overlap and rotate to a fresh key; invalidate related backend sessions
  only if separately warranted. Do not rotate `SESSION_SECRET` as part of HMAC
  rotation; it protects sessions and encrypted Salesforce connection records.

The verifier accepts the active `Key_Id__c`/`Shared_Secret__c` pair and an
optional `Previous_Key_Id__c`/`Previous_Shared_Secret__c` pair until
`Previous_Key_Expires_At__c`. No production key has been provisioned by this
change.

## Logging and Error Handling

- Never log request headers, canonical strings, nonce values, signatures,
  OAuth tokens, custom-setting rows, or key values.
- Return only sanitized authentication errors; never include key IDs' associated
  secret values or raw crypto/storage exceptions in responses.
- Use generic replay-storage errors and do not echo DML details.
- Treat missing/invalid key configuration and replay-ledger failures as hard
  authentication failures; do not fall back to local or in-memory auth.
- Keep Salesforce connection credentials encrypted under the existing
  `SESSION_SECRET`, and keep the Redis-backed session and connection stores.

## Local Verification

- `CivicTaxGatewayAuthTest` covers valid and invalid signatures, expired
  timestamps, nonce replay, missing configuration, previous-key overlap and
  expiry, cross-language HMAC compatibility, and nonce cleanup.
- `CivicTaxSecurityHardeningTest` covers property ownership and other Apex
  authorization rules.
- Full-package Salesforce deployment validation must pass before any deployment.
- Validation is not deployment and does not verify production key provisioning.
