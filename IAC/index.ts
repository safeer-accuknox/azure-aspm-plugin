import tl = require('azure-pipelines-task-lib/task');
import IaCScan, { IaCScanInputs } from './IAC';

 async function run() {
    try {
        const inputs: IaCScanInputs = {
            inputFile: tl.getInput('inputFile', false) || '', 
            inputDirectory: tl.getInput('inputDirectory', false) || './', 
            compact: tl.getBoolInput('inputCompact', false) || false, 
            quiet: tl.getBoolInput('inputQuiet', false) || false,
            framework: tl.getInput('inputFramework', false), 
            outputFormat: 'json',
            outputFilePath: './results',
            endpoint: tl.getInput('accuknoxEndpoint', true) as string, 
            tenantId: tl.getInput('accuknoxTenantId', true) as string, 
            label: tl.getInput('accuknoxLabel', true) as string, 
            token: tl.getInput('accuknoxToken', true) as string, 
        };

        const scan = new IaCScan(inputs);

        const exitCode = scan.run().catch((err) => {
            console.error('Pipeline failed.', err);
            tl.setResult(tl.TaskResult.Failed, err.message);
        });

        console.log("exitCode",  exitCode)
    }
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
 }

 run();