import 'dotenv/config';
import path from 'path';
import { ApiResource, Config } from '@cspark/sdk';
import { TRANSFORMS_PATH, readFileOnce } from './utils.js';

class Transforms extends ApiResource {
  publish(params) {
    const { name, folder, transform } = params;
    const url = this.config.baseUrl.concat({ version: 'api/v4', endpoint: `transforms/${folder}/${name}` });

    return this.request(url, { method: 'POST', body: { transform_content: transform } });
  }
}

async function main() {
  try {
    const { TRANSFORM_FOLDER: folder, TRANSFORM_NAME: name } = process.env;
    if (!folder || !name) throw 'TRANSFORM_FOLDER and TRANSFORM_NAME env vars must be set';
    const doc = { name, folder, transform: readFileOnce(path.join(TRANSFORMS_PATH, `${name}_transform.json`)) };

    const transforms = new Transforms(new Config({ logger: false }));
    const response = await transforms.publish(doc);
    if (response.status !== 200) throw 'Unable to publish transforms';

    console.log(`✅ Published \x1b[35m${response.data.outputs.transform_uri}\x1b[0m transform successfully!`);
  } catch (error) {
    console.error(`❌ Failed to publish transforms: ${error?.message || error}`);
    process.exit(1);
  }
}

main();
