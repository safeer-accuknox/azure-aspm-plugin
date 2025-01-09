# AccuKnox IaC Scan Extension for Azure DevOps

The **AccuKnox IaC Scan** extension integrates with Azure DevOps to scan infrastructure code files (e.g., Terraform, AWS CloudFormation, etc.) for security vulnerabilities. It helps ensure that your Infrastructure as Code (IaC) is secure by identifying misconfigurations and potential risks. This extension performs IaC scans, processes the results, and uploads them to AccuKnox for further analysis, ensuring secure and compliant infrastructure.

## Inputs and Descriptions

The following table outlines the input variables for the extension, their descriptions, and the default values:

| **Input**               | **Description**                                                                  | **Default Value**         |
|-------------------------|----------------------------------------------------------------------------------|---------------------------|
| **inputFile**           | Specify a file to scan (e.g., ".tf" for Terraform). Cannot be used with `INPUT_DIRECTORY`. | `NULL` (empty, optional)    |
| **inputDirectory**      | Directory containing IaC code or package manager files to scan.                 | `"."` (current directory) |
| **inputCompact**        | Whether to suppress code block display in the output.                            | `true` (boolean)          |
| **inputQuiet**          | If set, only failed checks will be shown in the output.                          | `true` (boolean)          |
| **inputFramework**      | Specify the infrastructure framework (e.g., Kubernetes, Terraform) to scan.      | `NULL` (empty, optional)    |
| **inputSoftFail**      | Prevent an error code return when checks fail (useful for non-blocking scans).  | `true` (boolean)          |
| **accuknoxTenantId**      | The tenant ID in the AccuKnox CSPM panel to associate with the scan results.     | **Required**              |
| **accuknoxEndpoint**    | The URL of the AccuKnox CSPM panel to send scan results.                         | **Required**              |
| **accuknoxLabel**       | The label used in AccuKnox SaaS to associate scan results.                       | **Required**              |
| **accuknoxToken**       | The authentication token for interacting with the AccuKnox CSPM panel.          | **Required**              |

## Example Configuration

Here’s an example of how to use the extension within your Azure DevOps pipeline:

```yaml
- task: safeer-accuknox-iac@0
  inputs:
    accuknoxEndpoint: '<ACCUKNOX_ENDPOINT>'
    accuknoxTenantId: '<ACCUKNOX_TENANT_ID>'
    accuknoxToken: '<ACCUKNOX_TOKEN>'
    accuknoxLabel: '<ACCUKNOX_LABEL>'
    inputQuiet: true
    inputCompact: true
```