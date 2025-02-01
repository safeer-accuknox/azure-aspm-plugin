import tl = require('azure-pipelines-task-lib/task');
import { exec } from 'child_process';

let qualityGateFailed = false;

function executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (error.message.includes('QUALITY GATE STATUS: FAILED')) {
                    qualityGateFailed = true;
                } else {
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

async function runSonarQubeSAST(sonarQubeUrl: string, sonarQubeToken: string, sonarQubeProjectKey: string, qualityGate: boolean): Promise<void> {
    const commandWithQualityGate = `docker run --rm \
    -e SONAR_HOST_URL=${sonarQubeUrl}  \
    -e SONAR_TOKEN=${sonarQubeToken} \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${sonarQubeProjectKey} -Dsonar.qualitygate.wait=true" \
    -v "$(pwd):/usr/src" \
    sonarsource/sonar-scanner-cli`

    const command = `docker run --rm \
    -e SONAR_HOST_URL=${sonarQubeUrl}  \
    -e SONAR_TOKEN=${sonarQubeToken} \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${sonarQubeProjectKey}" \
    -v "$(pwd):/usr/src" \
    sonarsource/sonar-scanner-cli`

    console.log('Running SonarQube SAST scan...');
    if (qualityGate) {
        await executeCommand(commandWithQualityGate);
    } else {
        await executeCommand(command);
    }
    console.log('SonarQube SAST scan completed.');
}

async function runAccuKnoxSAST(sonarQubeUrl: string, sonarQubeToken: string, sonarQubeProjectKey: string, sonarQubeOrganizationId: string): Promise<void> {
    let command = `docker run --rm \
    -e SQ_URL=${sonarQubeUrl} \
    -e SQ_AUTH_TOKEN=${sonarQubeToken} \
    -e SQ_PROJECTS=${sonarQubeProjectKey} \
    -e REPORT_PATH=/app/data \
    -v /tmp:/app/data \
    accuknox/sastjob:latest`

    if (sonarQubeOrganizationId && sonarQubeOrganizationId.trim() !== '') {
        command = `docker run --rm \
        -e SQ_URL=${sonarQubeUrl} \
        -e SQ_AUTH_TOKEN=${sonarQubeToken} \
        -e SQ_PROJECTS=${sonarQubeProjectKey} \
        -e REPORT_PATH=/app/data \
        -e SQ_ORG="${sonarQubeOrganizationId}" \
        -v /tmp:/app/data \
        accuknox/sastjob:latest`
    }

    console.log('Running AccuKnox SAST job...');
    await executeCommand(command);
    console.log('AccuKnox SAST job completed.');
}

async function uploadReport(accuknoxEndpoint: string, accuknoxTenantId: string, accuknoxToken: string, accuknoxLabel: string): Promise<void> {
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

async function qualityGateCheck(): Promise<void> {
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
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();