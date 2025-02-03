"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const child_process_1 = require("child_process");
let qualityGateFailed = false;
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                if (error.message.includes('QUALITY GATE STATUS: FAILED')) {
                    qualityGateFailed = true;
                }
                else {
                    reject(new Error(`Error: ${error.message}`));
                }
            }
            if (stderr) {
                console.warn(`Stderr: ${stderr}`);
            }
            console.log(`Stdout: ${stdout}`);
            resolve();
        });
    });
}
async function runSonarQubeSAST(sonarQubeUrl, sonarQubeToken, sonarQubeProjectKey, qualityGate) {
    const commandWithQualityGate = `docker run --rm \
    -e SONAR_HOST_URL=${sonarQubeUrl}  \
    -e SONAR_TOKEN=${sonarQubeToken} \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${sonarQubeProjectKey} -Dsonar.qualitygate.wait=true" \
    -v "$(pwd):/usr/src" \
    sonarsource/sonar-scanner-cli`;
    const command = `docker run --rm \
    -e SONAR_HOST_URL=${sonarQubeUrl}  \
    -e SONAR_TOKEN=${sonarQubeToken} \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${sonarQubeProjectKey}" \
    -v "$(pwd):/usr/src" \
    sonarsource/sonar-scanner-cli`;
    console.log('Running SonarQube SAST scan...');
    if (qualityGate) {
        await executeCommand(commandWithQualityGate);
    }
    else {
        await executeCommand(command);
    }
    console.log('SonarQube SAST scan completed.');
}
async function runAccuKnoxSAST(sonarQubeUrl, sonarQubeToken, sonarQubeProjectKey, sonarQubeOrganizationId) {
    let command = `docker run --rm \
    -e SQ_URL=${sonarQubeUrl} \
    -e SQ_AUTH_TOKEN=${sonarQubeToken} \
    -e SQ_PROJECTS=${sonarQubeProjectKey} \
    -e REPORT_PATH=/app/data \
    -v /tmp:/app/data \
    accuknox/sastjob:1.0.0`;
    if (sonarQubeOrganizationId && sonarQubeOrganizationId.trim() !== '') {
        command = `docker run --rm \
        -e SQ_URL=${sonarQubeUrl} \
        -e SQ_AUTH_TOKEN=${sonarQubeToken} \
        -e SQ_PROJECTS=${sonarQubeProjectKey} \
        -e REPORT_PATH=/app/data \
        -e SQ_ORG="${sonarQubeOrganizationId}" \
        -v /tmp:/app/data \
        accuknox/sastjob:1.0.0`;
    }
    console.log('Running AccuKnox SAST job...');
    await executeCommand(command);
    console.log('AccuKnox SAST job completed.');
}
async function uploadReport(accuknoxEndpoint, accuknoxTenantId, accuknoxToken, accuknoxLabel) {
    const curlCommand = `
    for file in \`ls -1 /tmp/SQ-*.json\`; do \
        curl --location --request POST \
        "https://${accuknoxEndpoint}/api/v1/artifact/?tenant_id=${accuknoxTenantId}&label_id=${accuknoxLabel}&data_type=SQ&save_to_s3=true" \
        --header "Tenant-Id: ${accuknoxTenantId}" \
        --header "Authorization: Bearer ${accuknoxToken}" \
        --form "file=@$file"; \
    done
    `;
    console.log('Uploading report to AccuKnox...');
    await executeCommand(curlCommand);
    console.log('Report uploaded successfully.');
}
async function qualityGateCheck() {
    if (qualityGateFailed) {
        throw new Error('Quality gate is failed, failing the pipeline.');
    }
}
async function run() {
    try {
        const sonarQubeUrl = tl.getInput('sonarQubeUrl', true);
        const sonarQubeToken = tl.getInput('sonarQubeToken', true);
        const sonarQubeProjectKey = tl.getInput('sonarQubeProjectKey', true);
        const accuknoxEndpoint = tl.getInput('accuknoxEndpoint', true);
        const accuknoxTenantId = tl.getInput('accuknoxTenantId', true);
        const accuknoxToken = tl.getInput('accuknoxToken', true);
        const accuknoxLabel = tl.getInput('accuknoxLabel', true);
        const qualityGate = tl.getBoolInput('qualityGate', false) || false;
        const skipSonarQubeScan = tl.getBoolInput('skipSonarQubeScan', false) || false;
        const sonarQubeOrganizationId = tl.getInput('sonarQubeOrganizationId', false) || '';
        if (!sonarQubeUrl || !sonarQubeToken || !sonarQubeProjectKey || !accuknoxEndpoint || !accuknoxTenantId || !accuknoxToken || !accuknoxLabel) {
            throw new Error('One or more required inputs are missing or empty.');
        }
        if (skipSonarQubeScan == false) {
            await runSonarQubeSAST(sonarQubeUrl, sonarQubeToken, sonarQubeProjectKey, qualityGate);
        }
        await runAccuKnoxSAST(sonarQubeUrl, sonarQubeToken, sonarQubeProjectKey, sonarQubeOrganizationId);
        await uploadReport(accuknoxEndpoint, accuknoxTenantId, accuknoxToken, accuknoxLabel);
        if (qualityGate) {
            await qualityGateCheck();
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
run();
