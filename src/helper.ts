import * as fs from 'fs';
import * as axios from 'axios';
import FormData from 'form-data';

export interface UploadResultsInputs {
  saveToS3: boolean,
  resultFile: string;
  endpoint: string;
  tenantId: string;
  label: string;
  token: string;
}

export default class Helper {

  constructor() {  }

  async uploadResults(inputs: UploadResultsInputs): Promise<void> {
    try {
      const resultFile = 'results.json';
      const fileStream = fs.createReadStream(resultFile);
      const formData = new FormData();
      formData.append('file', fileStream);

      const response = await axios.default.post(
        `https://${inputs.endpoint}/api/v1/artifact/`,
        formData,
        {
          headers: {
            'Tenant-Id': inputs.tenantId,
            Authorization: `Bearer ${inputs.token}`,
            ...formData.getHeaders(), 
          },
          params: {
            tenant_id: inputs.tenantId,
            data_type: 'TruffleHog',
            label_id: inputs.label,
            save_to_s3: inputs.saveToS3,
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