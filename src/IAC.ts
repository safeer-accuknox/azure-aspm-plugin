import * as fs from 'fs';
import { exec } from 'child_process';
import * as process from 'process';

const RESULTFILE = 'results.json';
const CHECKOV_IMAGE = 'bridgecrew/checkov:latest'

export interface IaCScanInputs {
  inputFile?: string;
  inputDirectory?: string;
  compact?: boolean;
  quiet?: boolean;
  framework?: string;
  outputFormat?: string;
  outputFilePath?: string;
}

interface IaCScanOuputs {
  exitCode: number;
  resultFile: string;
}

export default class IaCScan {
  private inputs: IaCScanInputs;
  private checkovWrkDir: string;

  constructor(inputs: IaCScanInputs) {
    this.inputs = inputs;
    this.inputs.outputFormat = this.inputs.outputFormat || 'json';
    this.checkovWrkDir = '/results';
  }

  async run(): Promise<IaCScanOuputs> {
    try {
      console.log('Starting IaC Scan...');
      await this.pullDockerImage();
      const exitCode = await this.runIaCScan();
      await this.processResultFile();
      return { exitCode, resultFile: RESULTFILE };
    } catch (error) {
      console.error(`Error during IaC scan: ${error}`);
      return { exitCode: 1, resultFile: RESULTFILE };
    }
  }

  private pullDockerImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkovCmd: string[] = [`docker pull ${CHECKOV_IMAGE}`];
      exec(checkovCmd.join(' '), (error, stdout, stderr) => {
        if (error) {
          console.warn(`Warning: Failed to pull Docker image: ${stderr}`);
        } else {
          console.log(`Docker image pulled successfully: ${stdout}`);
        }
        resolve();
      });
    });
  }

  private runIaCScan(): Promise<number> {
    return new Promise((resolve, reject) => {
      const checkovCmd: string[] = [`docker run --rm -v $PWD:${this.checkovWrkDir} ${CHECKOV_IMAGE}`];

      if (this.inputs.inputFile) {
        checkovCmd.push('-f', `${this.checkovWrkDir}/${this.inputs.inputFile}`);
      }

      if (this.inputs.inputDirectory) {
        checkovCmd.push('-d', `${this.checkovWrkDir}/${this.inputs.inputDirectory}`);
      }

      if (this.inputs.compact) {
        checkovCmd.push('--compact');
      }

      if (this.inputs.quiet) {
        checkovCmd.push('--quiet');
      }

      if (this.inputs.outputFormat) {
        checkovCmd.push('-o', this.inputs.outputFormat);
      }

      checkovCmd.push('--output-file-path', this.checkovWrkDir);

      if (this.inputs.framework) {
        checkovCmd.push('--framework', this.inputs.framework);
      }

      // console.log(`Executing command: ${checkovCmd.join(' ')}`);
      exec(checkovCmd.join(' '), (error, stdout, stderr) => {
        console.log(`Output: ${stdout}`);
        if (error) {
          console.error(`IaC Scan failed: ${stderr}`);
          resolve(1); 
        } else {
          resolve(0); 
        }
      });
    });
  }

  private async processResultFile(): Promise<void> {
    try {
      const checkovFile = 'results_json.json';
      const resultFile = RESULTFILE;
      fs.copyFileSync(checkovFile, resultFile);
      const data = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));

      const repoLink = process.env['BUILD_REPOSITORY_URI'] || 'unknown_repo';
      const branch = process.env['BUILD_SOURCEBRANCHNAME'] || 'unknown_branch';

      const enhancedData = Array.isArray(data) ? data : [data];
      enhancedData.push({
        details: {
          repo: repoLink,
          branch: branch,
        },
      });

      fs.writeFileSync(resultFile, JSON.stringify(enhancedData, null, 2));

      // console.log('Processed File Contents:');
      // console.log(fs.readFileSync(resultFile, 'utf-8'));
      console.log('Result file processed successfully.');
    } catch (error) {
      console.error(`Error processing result file: ${error}`);
      throw error;
    }
  }
}