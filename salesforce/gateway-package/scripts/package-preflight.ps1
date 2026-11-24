param(
    [string]$DevHubAlias = $env:CIVICTAX_DEVHUB_ALIAS,
    [string]$NamespaceOrgAlias = $env:CIVICTAX_NAMESPACE_ORG_ALIAS
)

$ErrorActionPreference = 'Stop'
$expectedDevHubOrgId = '00Dfj00000oPoePEAS'
$expectedNamespaceOrgId = '00DgL00000jkktx'
$expectedNamespacePrefix = 'civictaxapp'

function Get-CanonicalOrgId {
    param([string]$OrgId)

    if ($OrgId -notmatch '^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$') {
        return $null
    }
    return $OrgId.Substring(0, 15)
}

$expectedDevHubOrgId = Get-CanonicalOrgId $expectedDevHubOrgId
$expectedNamespaceOrgId = Get-CanonicalOrgId $expectedNamespaceOrgId

$projectPath = Join-Path $PSScriptRoot '..\sfdx-project.json'
$project = Get-Content -Raw $projectPath | ConvertFrom-Json

if ($project.namespace -cne $expectedNamespacePrefix) {
    throw "Package namespace must be '$expectedNamespacePrefix'."
}
if ([string]::IsNullOrWhiteSpace($DevHubAlias) -or
    [string]::IsNullOrWhiteSpace($NamespaceOrgAlias)) {
    throw 'Set CIVICTAX_DEVHUB_ALIAS and CIVICTAX_NAMESPACE_ORG_ALIAS to authorized CLI org aliases.'
}

$devHubJson = sf org display --target-org $DevHubAlias --json
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the configured Dev Hub alias.' }
$devHub = ($devHubJson | ConvertFrom-Json).result
$devHubOrgId = Get-CanonicalOrgId $devHub.id
if ($devHub.connectedStatus -ne 'Connected' -or
    $null -eq $devHubOrgId -or
    $devHubOrgId -cne $expectedDevHubOrgId) {
    throw "Dev Hub alias '$DevHubAlias' does not resolve to the expected authenticated org."
}
Write-Output "PASS: Dev Hub alias '$DevHubAlias' resolves to org $($devHub.id)."

$orgListJson = sf org list --all --json
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect Salesforce CLI org authentication.' }
$orgList = ($orgListJson | ConvertFrom-Json).result
$orgs = @($orgList.nonScratchOrgs) + @($orgList.scratchOrgs)
$devHubListing = @($orgs | Where-Object {
    (Get-CanonicalOrgId $_.orgId) -ceq $devHubOrgId
})
if ($devHubListing.Count -ne 1 -or
    $devHubListing[0].connectedStatus -ne 'Connected' -or
    $devHubListing[0].isDevHub -ne $true) {
    throw 'The expected Dev Hub org ID is not marked as an authenticated Dev Hub in the CLI org list.'
}
Write-Output "PASS: CLI org listing marks org $($devHub.id) as an authenticated Dev Hub."

$namespaceJson = sf org display --target-org $NamespaceOrgAlias --json
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the namespace registration org alias.' }
$namespaceOrg = ($namespaceJson | ConvertFrom-Json).result
$namespaceOrgId = Get-CanonicalOrgId $namespaceOrg.id
if ($namespaceOrg.connectedStatus -ne 'Connected' -or
    $null -eq $namespaceOrgId -or
    $namespaceOrgId -cne $expectedNamespaceOrgId) {
    throw "Namespace org alias '$NamespaceOrgAlias' does not resolve to the expected authenticated org."
}
if ($namespaceOrgId -ceq $devHubOrgId) {
    throw 'Use a separate Developer Edition namespace registration org and Dev Hub.'
}
Write-Output "PASS: Namespace org alias '$NamespaceOrgAlias' resolves to org $($namespaceOrg.id)."

$namespaceOrgQuery = sf data query --target-org $NamespaceOrgAlias --query `
    'SELECT NamespacePrefix FROM Organization LIMIT 1' `
    --json
if ($LASTEXITCODE -ne 0) { throw 'Unable to query the namespace prefix from the namespace org.' }
$namespaceOrgResult = ($namespaceOrgQuery | ConvertFrom-Json).result
$namespaceOrgPrefix = [string]$namespaceOrgResult.records[0].NamespacePrefix
if ($namespaceOrgResult.totalSize -ne 1 -or
    $namespaceOrgPrefix -cne $expectedNamespacePrefix) {
    throw 'The namespace org does not report the expected namespace prefix.'
}
Write-Output "PASS: Namespace org reports prefix '$namespaceOrgPrefix'."

$escapedNamespace = $expectedNamespacePrefix.Replace("'", "''")
$registryJson = sf data query --target-org $DevHubAlias --query `
    "SELECT NamespacePrefix, NamespaceOrg FROM NamespaceRegistry WHERE NamespacePrefix = '$escapedNamespace'" `
    --json
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect namespace linkage in the configured Dev Hub.' }
$registry = ($registryJson | ConvertFrom-Json).result
$namespaceLinks = @($registry.records | Where-Object {
    $_.NamespacePrefix -ceq $expectedNamespacePrefix -and
    (Get-CanonicalOrgId $_.NamespaceOrg) -ceq $namespaceOrgId
})
if ($namespaceLinks.Count -ne 1) {
    throw 'The configured namespace is not linked from the Dev Hub to the namespace org.'
}
Write-Output "PASS: Dev Hub NamespaceRegistry links '$expectedNamespacePrefix' to org $($namespaceOrg.id)."

Write-Output 'Package preflight passed: org identities, Dev Hub status, namespace prefix, and registry link are verified.'
Write-Output 'This script is read-only and does not create, install, validate, or deploy packages.'
