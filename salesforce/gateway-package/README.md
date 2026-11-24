# CivicTax Gateway Security 2GP package

This isolated Salesforce DX project packages only the inbound HMAC boundary:
the verifier, replay ledger, key-provisioning UI, protected configuration, and
their tests. It deliberately does not package or clone the CivicTax citizen,
property, assessment, or payment data model.

The package project is configured for the registered `civictaxapp` namespace.
Use `aegis-second` (org ID `00Dfj00000oPoePEAS`) as the authorized Dev Hub and
`civictax-namespace-verified` (org ID `00DgL00000jkktx`) as the separately
registered namespace org. The existing package is
`0Hofj00000066txCAA`; version `0.1.0.2` (`04tfj000000nVM1AAM`) already exists.
Do not create a duplicate package. Protected visibility in these source files
is **not effective** until a managed package is installed and the installed
namespace and component visibility are verified. Do not install this package
into production without explicit approval.

## Components included

- `CivicTaxGatewayAuth`: global verifier API, request HMAC, timestamp/key checks,
  and call into the package-private nonce claim.
- `CivicTaxGatewayReplayGuard`: atomic unique-key replay claim.
- `CivicTaxGatewayNonceCleanup`: scheduled batch cleanup of expired nonce hashes.
- `CivicTaxGatewayProvisioning`: write-only key provisioning API guarded by a
  package custom permission.
- `CivicTax_Gateway_Config__c`: protected hierarchy setting with active and
  bounded previous-key fields.
- `CivicTax_Gateway_Nonce__c`: private object storing only nonce hashes and
  expiry. Salesforce custom objects do not support Protected visibility.
- `CivicTax_Gateway_Key_Administrator` permission set and the password-style
  LWC provisioning form.

## Source-of-truth boundary

The application source under `salesforce/force-app` contains the CivicTax
business logic and the runtime namespaced gateway integration bridge. The
managed-package bridge still requires validation in the dedicated subscriber
scratch org before any production installation. The package project has its own
`sfdx-project.json`; do not combine both source trees in one deployment
directory. `CivicTaxRestResource` calls
`civictaxapp.CivicTaxGatewayAuth.authenticate(...)` at runtime and uses the
unmanaged verifier only in Apex unit tests. Keep the package implementation as
the gateway source of truth; validate the namespaced bridge in the dedicated
subscriber scratch org before any production installation.

## Read-only prerequisites

Run `scripts/package-preflight.ps1` from this directory after assigning the
environment variables documented in `INSTALLATION.md`. It does not create,
install, validate, or deploy a package.
