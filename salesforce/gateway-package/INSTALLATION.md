# Managed package prerequisites and installation runbook

## Required Salesforce setup

1. Select the production namespace deliberately. Salesforce does not allow a
   managed 2GP package's namespace or owning Dev Hub to be changed after package
   creation. Do not select a disposable namespace if it may be needed for the
   real CivicTax package.
2. The registered namespace `civictaxapp` belongs to the separate
   `civictax-namespace-verified` org (`00DgL00000jkktx`). Do not use that org as
   the Dev Hub or subscriber test org.
3. Use `aegis-second` (`00Dfj00000oPoePEAS`) as the authorized Dev Hub. The
   namespace registration org must remain separate from the Dev Hub and
   subscriber scratch org; the namespace is linked in Setup > Namespace
   Registry.
4. Authorize both orgs with Salesforce CLI. Confirm `sf org list --all --json`
   shows the intended Dev Hub and run this project's
   `scripts/package-preflight.ps1`.
5. This isolated package project's `namespace` is set to `civictaxapp`.
   Confirm it matches the namespace shown in the separate namespace-registration
   org and linked in the intended Dev Hub before package creation. Keep the root
   `salesforce/sfdx-project.json` unchanged. The package project must use the
   same namespace as the protected setting and gateway Apex.
6. The managed package already exists as `0Hofj00000066txCAA`; version `0.1.0.2`
   is `04tfj000000nVM1AAM`. Do not create a duplicate package. Create another
   version only for an approved source release, from this directory and the
   authorized Dev Hub, using a generated installation key stored outside
   source control. Do not bypass validation.
7. Test only in a dedicated scratch org first. Install the version there, then
   verify the installed package namespace and that the hierarchy setting is
   Protected. Confirm Apex in that namespace can read its own setting while
   subscriber Apex/API users cannot retrieve the protected setting. Confirm
   the nonce object remains Private and that the package permission set grants
   no direct object access. Nonce hashes are replay markers, not secrets;
   Salesforce does not support Protected visibility for custom objects, and
   org administrators remain within the customer's trust boundary. Only then
   plan a separate production installation.

Salesforce documentation:

- [Before creating 2GP packages](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-before.html)
- [Register a 2GP namespace](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-create-namespace.html)
- [Link a namespace to Dev Hub](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-reg-namespace.html)
- [Enable Dev Hub](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-pkg-enable-devhub.html)
- [2GP workflow](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-workflow.html)
- [Protected custom settings](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-customsettings.html)

## Existing CivicTax integration boundary

The gateway package intentionally does not clone `CivicTax_User__c`,
`Property__c`, or application business classes. Its global
`CivicTaxGatewayAuth.authenticate(...)` verifies the signed request and returns
the verified CivicTax user ID only. The existing unmanaged
`CivicTaxRestResource` integration point calls
`civictaxapp.CivicTaxGatewayAuth.authenticate(...)` and passes only that
returned identity to the existing `CivicTaxSecurityService`, which continues
to resolve the active citizen mapping and Contact. This bridge is present in
the source; validate it against the installed package in the dedicated
subscriber scratch org before enabling the gateway. Do not trust any identity
supplied outside the signed result.

Installing this package alone does not migrate or replace CivicTax business
records. The existing public unnamespaced setting row is not read, updated,
deleted, or migrated by the package. The package's namespaced protected setting
is a different component and starts unconfigured.

## Initial key provisioning

The package permission set grants a specific custom permission for the
write-only provisioning controller. Assign it only to a tightly controlled
setup administrator after verifying the package installation. Open the
`CivicTax Gateway Key Setup` Lightning component from an admin-only Lightning
App/Home page. Generate an HMAC key externally using a CSPRNG with at least 32
random bytes; choose a separate non-secret key ID. Enter the key ID and value
into the password input, and store the exact value in the backend provider's
secret manager as `CIVICTAX_GATEWAY_SHARED_SECRET`; configure the matching
`CIVICTAX_GATEWAY_KEY_ID`. The setup endpoint returns only a status message and
never exposes a read operation. The UI clears the entered key after success.
Do not put the key in Execute Anonymous, command history, source control, logs,
or chat.

The current production secret is intentionally not provisioned. Do not
configure the existing unmanaged Public custom setting with a production key.

## Rotation and revocation

The verifier accepts the active key ID/key and an optional previous pair until
an explicit expiry. To rotate, set the new pair active and the old pair as
previous with an overlap that includes rollout completion plus the five-minute
request timestamp window and clock-skew margin. Update the backend key ID and
secret during that bounded overlap, then provision the old pair as empty after
all backend instances use the new key. The endpoint enforces a maximum 24-hour
previous-key window. To revoke a compromised key, remove its key ID from the
accepted pair and the backend immediately; do not retain an overlap.

Never rotate `SESSION_SECRET` as part of HMAC key rotation; it protects sessions
and encrypted Salesforce connection credentials.

## Operations and risk controls

- Schedule `CivicTaxGatewayNonceCleanup` daily from Setup > Apex Classes >
  Schedule Apex. Confirm it runs, and monitor only sanitized status/row counts.
- The replay ledger uses a unique field, so Salesforce's database constraint is
  the concurrency boundary. Concurrent duplicates must result in one claim and
  rejected duplicates; sequential Apex tests cannot simulate independent
  concurrent transactions, so verify this behavior in the scratch org with a
  parallel integration test before production.
- The package permission set does not grant direct CRUD/FLS on the protected
  setting or nonce object. Its custom permission gates only the provisioning
  method. The nonce object uses private sharing and stores only a one-way hash
  plus expiry; the package Apex performs its replay-claim/cleanup operations.
  Custom-object rows are not Protected from org administrators.
- HMAC request headers, request bodies containing personal data, auth tokens,
  keys, signatures, and nonces must not be logged. Authentication errors are
  generic. Rotate/revoke immediately if a key could have entered logs.
- Keep Redis-backed session persistence and encrypted Salesforce credential
  storage unchanged. Keep citizen-to-Contact mapping and property ownership
  enforcement in the existing CivicTax application layer.
