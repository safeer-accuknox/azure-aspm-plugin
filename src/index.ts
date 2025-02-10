import tl = require('azure-pipelines-task-lib');
import SecretScan, { SecretScanInputs } from './secret-scan';
import Helper, { UploadResultsInputs } from './helper';
import * as fs from 'fs';

 async function run() {
    try {

        //--------------------------- SCAN: START ---------------------------
        const inputs: SecretScanInputs = {
            results: tl.getInput('results', false) || '', 
            branch: tl.getInput('branch', false) || '', 
            excludePaths: tl.getInput('excludePaths', false) || '', 
            additionalArguments: tl.getInput('additionalArguments', false) || '', 
        };
        const scan = new SecretScan(inputs);
        const { exitCode, resultFile } = await scan.run()
        const resultFileSize = fs.statSync(resultFile).size
        //--------------------------- SCAN: END ---------------------------

        if(resultFileSize > 0){
            //--------------------------- UPLOAD: START ---------------------------
            const helper = new Helper()
            const uploadResults: UploadResultsInputs = {
                endpoint: tl.getInput('accuknoxEndpoint', true) as string, 
                tenantId: tl.getInput('accuknoxTenantId', true) as string, 
                label: tl.getInput('accuknoxLabel', true) as string, 
                token: tl.getInput('accuknoxToken', true) as string, 
                saveToS3: tl.getBoolInput('accuknoxSaveToS3', false) || true, 
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
            // --------------------------- HANDLE ERROR: START ---------------------------
        }else{
            console.log("No secrets found. Skipping API upload.")
            tl.setResult(tl.TaskResult.Succeeded, "No secrets found. Skipping API upload.");
        }
    }
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
 }

 run();