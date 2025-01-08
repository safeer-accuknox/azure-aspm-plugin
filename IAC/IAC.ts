import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as axios from 'axios';
import * as process from 'process';

export interface IaCScanInputs {
  inputFile?: string;
  inputDirectory?: string;
  compact?: boolean;
  quiet?: boolean;
  framework?: string;
  outputFormat?: string;
  outputFilePath?: string;
  endpoint: string;
  tenantId: string;
  label: string;
  token: string;
}

export default class IaCScan {
  private inputs: IaCScanInputs;

  constructor(inputs: IaCScanInputs) {
    this.inputs = inputs;
    this.inputs.outputFormat = this.inputs.outputFormat || 'json';
    this.inputs.outputFilePath = this.inputs.outputFilePath || './results';
  }

  async run(): Promise<void> {
    try {
      console.log('Starting IaC Scan...');
      await this.runIaCScan();
    //   await this.processResultFile();
    //   await this.uploadResults();
    } catch (error) {
      console.error(`Error during IaC scan: ${error}`);
      throw error;
    }
  }

  private runIaCScan(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkovCmd: string[] = ['checkov'];

      if (this.inputs.inputFile) {
        checkovCmd.push('-f', this.inputs.inputFile);
      }

      if (this.inputs.inputDirectory) {
        checkovCmd.push('-d', this.inputs.inputDirectory);
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

      if (this.inputs.outputFilePath) {
        checkovCmd.push('--output-file-path', this.inputs.outputFilePath);
      }

      if (this.inputs.framework) {
        checkovCmd.push('--framework', this.inputs.framework);
      }

      console.log(`Executing command: ${checkovCmd.join(' ')}`);

      exec(checkovCmd.join(' '), (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Checkov: ${stderr}`);
          return reject(error);
        }
        console.log(stdout);
        resolve();
      });
    });
  }

  private async processResultFile(): Promise<void> {
    try {
      const resultFile = path.join(this.inputs.outputFilePath!, 'results_json.json');
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
      console.log('Result file processed successfully.');
    } catch (error) {
      console.error(`Error processing result file: ${error}`);
      throw error;
    }
  }

  private async uploadResults(): Promise<void> {
    try {
      const resultFile = path.join(this.inputs.outputFilePath!, 'results_json.json');
      const fileStream = fs.createReadStream(resultFile);

      const response = await axios.default.post(
        `https://${this.inputs.endpoint}/api/v1/artifact/`,
        fileStream,
        {
          headers: {
            'Tenant-Id': this.inputs.tenantId,
            Authorization: `Bearer ${this.inputs.token}`,
          },
          params: {
            tenant_id: this.inputs.tenantId,
            data_type: 'IAC',
            label_id: this.inputs.label,
            save_to_s3: 'false',
          },
        }
      );

      console.log(`Upload successful. Response: ${response.status}`);
    } catch (error) {
      console.error(`Error uploading results: ${error}`);
      throw error;
    }
  }
}