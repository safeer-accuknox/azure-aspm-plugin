import tl = require('azure-pipelines-task-lib');
import IaCScan, { IaCScanInputs } from './IAC';
import Helper, { UploadResultsInputs } from './helper';

 async function run() {
    try {

        //--------------------------- SCAN: START ---------------------------
        const inputs: IaCScanInputs = {
            inputFile: tl.getInput('inputFile', false) || '', 
            inputDirectory: tl.getInput('inputDirectory', false) || './', 
            compact: tl.getBoolInput('inputCompact', false) || false, 
            quiet: tl.getBoolInput('inputQuiet', false) || false,
            framework: tl.getInput('inputFramework', false), 
            outputFormat: 'json',
            outputFilePath: './results'
        };
        const scan = new IaCScan(inputs);
        const { exitCode, resultFile } = await scan.run()
        //--------------------------- SCAN: END ---------------------------

        //--------------------------- UPLOAD: START ---------------------------
        const helper = new Helper()
        const uploadResults: UploadResultsInputs = {
            endpoint: tl.getInput('accuknoxEndpoint', true) as string, 
            tenantId: tl.getInput('accuknoxTenantId', true) as string, 
            label: tl.getInput('accuknoxLabel', true) as string, 
            token: tl.getInput('accuknoxToken', true) as string, 
            resultFile
        }
        await helper.uploadResults(uploadResults).catch((err) => {
            console.error('Upload failed.', err.mmessage);
        });
        //--------------------------- UPLOAD: END ---------------------------
        
        //--------------------------- HANDLE ERROR: START ---------------------------
        const softFail = tl.getBoolInput('inputSoftFail', false) || false
        if (exitCode !== 0) {
            if (softFail) {
                console.log("Scan failed, but soft fail is enabled. Continuing...")
                tl.setResult(tl.TaskResult.Succeeded, "Scan failed, but soft fail is enabled. Continuing...");
            } else {
                console.error(".");
                tl.setResult(tl.TaskResult.Failed, "Scan failed and soft fail is disabled. Exiting with failure");
            }
        } else {
            console.log("Scan completed successfully.")
            tl.setResult(tl.TaskResult.Succeeded, "Scan completed successfully.");
        }
        //--------------------------- HANDLE ERROR: START ---------------------------
    }
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
 }

 run();