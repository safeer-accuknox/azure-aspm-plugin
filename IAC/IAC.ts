import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as axios from 'axios';
import * as process from 'process';
import FormData from 'form-data';

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
  private checkovWrkDir: string;

  constructor(inputs: IaCScanInputs) {
    this.inputs = inputs;
    this.inputs.outputFormat = this.inputs.outputFormat || 'json';
    this.checkovWrkDir = '/results';
  }

  async run(): Promise<number> {
    try {
      console.log('Starting IaC Scan...');
      const exitCode = await this.runIaCScan();
      await this.processResultFile();
      await this.uploadResults();
      return exitCode
    } catch (error) {
      console.error(`Error during IaC scan: ${error}`);
      throw error;
    }
  }

  private runIaCScan(): Promise<number> {
    return new Promise((resolve, reject) => {
      const checkovCmd: string[] = [`docker run --rm -v $PWD:${this.checkovWrkDir} ghcr.io/bridgecrewio/checkov:3.2.21`];

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

      console.log(`Executing command: ${checkovCmd.join(' ')}`);

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
      const resultFile = 'results.json';
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

  private async uploadResults(): Promise<void> {
    try {
      const resultFile = 'results.json';
      const fileStream = fs.createReadStream(resultFile);
      const formData = new FormData();
      formData.append('file', fileStream);

      const response = await axios.default.post(
        `https://${this.inputs.endpoint}/api/v1/artifact/`,
        formData,
        {
          headers: {
            'Tenant-Id': this.inputs.tenantId,
            Authorization: `Bearer ${this.inputs.token}`,
            ...formData.getHeaders(), 
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