## Development & Build Notes

- **Compile TypeScript**: Navigate to the `src` directory and run `tsc` to transpile `*.ts` files to `*.js` for JavaScript execution. Ignore any errors during the compilation process.
- **Package the Extension**: Move back to the root directory. Use `npx tfx-cli extension create` to generate the `.vsix` file (plugin package). Ensure the version in `task.json` and `vss-extension.json` is updated before creating the package.
- **Upload to Marketplace**: After generating the .vsix file, upload it to the Visual Studio Marketplace

## Reference Links

- [Getting Started with Azure DevOps Extensions (Node.js)](https://learn.microsoft.com/en-us/azure/devops/extend/get-started/node?view=azure-devops)
- [Develop and Add a Build Task to Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops)
- **Self-hosted Agent**: A self-hosted agent is required for unpaid Azure DevOps plans to run the extension.
    - **Self-hosted Agent Setup**: [Step-by-Step Guide for Setting Up a Self-Hosted Agent](https://medium.com/@shekhartarare/creating-a-self-hosted-agent-for-azure-pipelines-a-step-by-step-guide-a1cbd1c683d1), 

## Azure Resources

- **Azure Pipeline**: [AccuKnox Scan Pipeline](https://dev.azure.com/safeer-accuknox/scan)
- **Azure Plugin**: [AccuKnox Plugin on Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/safeer-accuknox)


## Test Notes
- Upload it as a private plugin: https://marketplace.visualstudio.com/manage/publishers/safeer-accuknox
- Share access to the `safeer-accuknox`
- Then install it on https://dev.azure.com/safeer-accuknox/_settings/extensions?tab=shared
- And test it on dev.azure
