import jsonata from 'jsonata';
import { join } from 'path';
import { ASSETS_PATH, readFileOnce, isValidJsonata } from './utils.js';

const MAPPING_FILE = join(ASSETS_PATH, 'mapping.json');

const getNestedValue = (obj, dotPath) => {
  return dotPath.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
};

const validateMappingSection = (section, sectionName, errors, warnings) => {
  if (!section || typeof section !== 'object') {
    errors.push(`"${sectionName}" must be an object`);
    return;
  }

  if (!section.source || typeof section.source !== 'string') {
    errors.push(`"${sectionName}.source" must be a file path string`);
  }
  if (!section.target || typeof section.target !== 'string') {
    errors.push(`"${sectionName}.target" must be a file path string`);
  }
  if (!Array.isArray(section.mappings)) {
    errors.push(`"${sectionName}.mappings" must be an array`);
    return;
  }
  if (section.mappings.length === 0) {
    warnings.push(`"${sectionName}.mappings" is empty`);
    return;
  }

  let sourceData = null;
  let targetData = null;

  try {
    const sourcePath = join(ASSETS_PATH, '..', section.source);
    sourceData = JSON.parse(readFileOnce(sourcePath));
  } catch {
    errors.push(`${sectionName}: cannot read source fixture "${section.source}"`);
  }

  try {
    const targetPath = join(ASSETS_PATH, '..', section.target);
    targetData = JSON.parse(readFileOnce(targetPath));
  } catch {
    errors.push(`${sectionName}: cannot read target fixture "${section.target}"`);
  }

  section.mappings.forEach((mapping, i) => {
    const prefix = `${sectionName}.mappings[${i}]`;

    if (!mapping.source_path || typeof mapping.source_path !== 'string') {
      errors.push(`${prefix}: "source_path" is required and must be a string`);
    }
    if (!mapping.target_path || typeof mapping.target_path !== 'string') {
      errors.push(`${prefix}: "target_path" is required and must be a string`);
    }

    if (sourceData && mapping.source_path) {
      const value = getNestedValue(sourceData, mapping.source_path);
      if (value === undefined) {
        warnings.push(`${prefix}: source_path "${mapping.source_path}" not found in "${section.source}"`);
      }
    }

    if (targetData && mapping.target_path) {
      const value = getNestedValue(targetData, mapping.target_path);
      if (value === undefined) {
        warnings.push(`${prefix}: target_path "${mapping.target_path}" not found in "${section.target}"`);
      }
    }

    if (mapping.transform !== null && mapping.transform !== undefined) {
      if (typeof mapping.transform !== 'string') {
        errors.push(`${prefix}: "transform" must be a string or null`);
      } else {
        const testExpr = `$x ${mapping.transform}`;
        if (!isValidJsonata(testExpr)) {
          errors.push(`${prefix}: "transform" is not valid JSONata: "${mapping.transform}"`);
        }
        if (mapping.transform.includes('`')) {
          errors.push(`${prefix}: "transform" must not contain backticks`);
        }
      }
    }
  });
};

function main() {
  const errors = [];
  const warnings = [];

  console.log(`Validating mapping document: ${MAPPING_FILE}\n`);

  let mapping;
  try {
    mapping = JSON.parse(readFileOnce(MAPPING_FILE));
  } catch (error) {
    console.error(`❌ Failed to read mapping document: ${error.message}`);
    process.exit(1);
  }

  if (!mapping.$schema || !mapping.$schema.startsWith('mapping-document')) {
    errors.push('"$schema" must start with "mapping-document"');
  }

  validateMappingSection(mapping.request, 'request', errors, warnings);
  validateMappingSection(mapping.response, 'response', errors, warnings);

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
    console.log();
  }

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach((e) => console.log(`  ❌ ${e}`));
    console.error(`\nValidation failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log('✅ Mapping document is valid.');
}

main();
