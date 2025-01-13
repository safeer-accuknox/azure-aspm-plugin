import * as fs from 'fs';
import { exec } from 'child_process';
import * as process from 'process';

const RESULTFILE = 'results.json';
const TRUFFLEHOG_IMAGE = 'trufflesecurity/trufflehog:3.88.1'


export interface SecretScanInputs {
  results?: string;
  branch?: string;
  excludePaths?: string;
  additionalArguments?: string;
}

interface SecretScanOuputs {
  exitCode: number;
  resultFile: string;
}

export default class SecretScan {
  private inputs: SecretScanInputs;
  private truffleHogWrkDir: string;

  constructor(inputs: SecretScanInputs) {
    this.inputs = inputs;
    this.truffleHogWrkDir = '/results';
  }

  async run(): Promise<SecretScanOuputs> {
    try {
      console.log('Starting Secret Scan...');
      await this.pullDockerImage();
      const exitCode = await this.runSecretScan();
      return { exitCode, resultFile: RESULTFILE };
    } catch (error) {
      console.error(`Error during Secret scan: ${error}`);
      return { exitCode: 1, resultFile: RESULTFILE };
    }
  }

  private pullDockerImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const truffleHogCmd: string[] = [`docker pull ${TRUFFLEHOG_IMAGE}`];
      exec(truffleHogCmd.join(' '), (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.warn(`Warning: Failed to pull Docker image: ${stderr}`);
        } else {
          console.log(`Docker image pulled successfully: ${stdout}`);
        }
        resolve();
      });
    });
  }

  private runSecretScan(): Promise<number> {
    return new Promise((resolve, reject) => {
      const truffleHogCmd: string[] = [`docker run --rm -v $PWD:${this.truffleHogWrkDir} ${TRUFFLEHOG_IMAGE} git file://${this.truffleHogWrkDir} --json --no-update`];

      if (this.inputs.results) {
        truffleHogCmd.push('--results', this.inputs.results);
      }

      if (this.inputs.excludePaths) {
        truffleHogCmd.push('-x', this.inputs.excludePaths);
      }

      let branchFlag = '';
      if (this.inputs.branch === 'all-branches') {
        branchFlag = '';
      } else if (this.inputs.branch) {
        branchFlag = `--branch=${this.inputs.branch}`;
      } else if (process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH) {
        branchFlag = `--branch=${process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH}`;
      } else if (process.env.BUILD_SOURCEBRANCHNAME) {
        branchFlag = `--branch=${process.env.BUILD_SOURCEBRANCHNAME}`;
      }

      if (branchFlag) {
        truffleHogCmd.push(branchFlag);
      }

      if (this.inputs.additionalArguments) {
        truffleHogCmd.push(this.inputs.additionalArguments);
      }

      truffleHogCmd.push(`> ${RESULTFILE}`);
      exec(truffleHogCmd.join(' '), (error: any, stdout: any, stderr: any) => {
        console.log(`Output: ${stdout}`);
        if (error) {
          console.error(`Secret Scan failed: ${stderr}`);
          resolve(1); 
        } else {
          resolve(0); 
        }
      });
    });
  }
}