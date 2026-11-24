# CivicTax Gateway Secret Migration

## Security Target

`CivicTax_Gateway_Config__c` is a protected hierarchy custom setting with a
255-character Text field named `Shared_Secret__c`. The source repository
contains no secret value. The Text field is source-deployable, but the secret
itself must be entered only through Salesforce Setup or an approved protected
deployment mechanism.

This custom setting is the appropriate in-org HMAC mechanism for the current
inbound Apex gateway because Salesforce Named Credentials and External
Credentials do not expose an external credential value to Apex code for signing
or verifying an arbitrary HMAC canonical message.

## Migration Procedure

1. Generate a high-entropy shared secret outside Salesforce.
2. Deploy this metadata before changing gateway authentication behavior.
3. In Salesforce Setup, open Custom Settings and select
   `CivicTax Gateway Config`.
4. Open Manage and create or update the organization default row.
5. Enter the generated secret only in `Shared Secret`; do not paste it into
   source control, reports, Apex, logs, or API payloads.
6. Rotate the backend environment secret to the same value through its existing
   secret manager.
7. Perform a short overlap with the old and new secret only if the backend and
   Salesforce support dual-key verification. Otherwise, rotate both sides
   together during a maintenance window.
8. Remove the old public custom-setting value after all gateway traffic uses
   the new secret and HMAC tests pass.

## Verification

- Run `CivicTaxGatewayAuthTest`.
- Run `CivicTaxSecurityHardeningTest`.
- Confirm the custom setting and field are not public.
- Confirm secret-bearing request headers are absent from application logs.
- Confirm REST responses contain no secret or signature material.

## Dependencies

- `CivicTaxGatewayAuth.authenticate`
- `CivicTaxRestResource.handleGet`, `handlePost`, and `handlePatch`
- `CivicTaxSecurityService.requestIdentity`
- Backend gateway signing code and the backend secret environment variable
