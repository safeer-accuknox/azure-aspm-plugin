# AccuKnox Secret Scan Extension for Azure DevOps

The secret scanning section of the GitLab CI/CD pipeline is designed to integrate with AccuKnox to scan for hardcoded secrets and sensitive information in the git repositories.

Here's the table that outlines the inputs and their descriptions, along with default values:

| **Input Value**         | **Description**                                                                                     | **Default Value**                  |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **results**             | Specifies which type(s) of results to output: `verified`, `unknown`, `unverified`, `filtered_unverified`. Defaults to all types. | `""`                               |
| **branch**              | The branch to scan. Use `all-branches` to scan all branches.                                        | `""`                               |
| **excludePaths**       | Paths to exclude from the scan.                                                                     | `""`                               |
| **additionalArguments**| Extra parameters for secret scanning.                                                               | `""`                               |
| **inputSoftFail**     | Do not return an error code if secrets are found.                                                   | `true`                             |
| **accuknoxToken**      | The token for authenticating with the CSPM panel.                                                   | N/A (Required)                     |
| **accuknoxTenantId**     | The ID of the tenant associated with the CSPM panel.                                                | N/A (Required)                     |
| **accuknoxEndpoint**   | The URL of the CSPM panel to push the scan results to.                                              | N/A (Required)           |
| **accuknoxLabel**      | The label created in AccuKnox SaaS for associating scan results.                                     | N/A (Required)                     |

#### Example

```yaml
- task: safeer-accuknox-secret-scan@0
  inputs:
    accuknoxEndpoint: '<ACCUKNOX_ENDPOINT>'
    accuknoxTenantId: '<ACCUKNOX_TENANT_ID>'
    accuknoxToken: '<ACCUKNOX_TOKEN>'
    accuknoxLabel: '<ACCUKNOX_LABEL>'
    inputSoftFail: true
```

This example defines a job for secret scanning and then uploads scan results to the AccuKnox platform