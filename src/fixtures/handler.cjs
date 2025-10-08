const fs = require('fs');
const path = require('path');

const transformName = process.env.TRANSFORM_NAME;
const transformPath = path.join(__dirname, '..', '..', 'dist', `${transformName}_transform.json`);
const { transform_code, transform_type } = JSON.parse(fs.readFileSync(transformPath, 'utf8'));

if (!/Nodejs22/i.test(transform_type)) {
  throw new Error(`Error: only Node.js transforms are supported for e2e testing.\nReceived: ${transform_type}`);
}

// production-ready handler
module.exports = new Function('require', transform_code + '; return handler;')(require);
