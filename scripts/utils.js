import fs from 'fs';
import path from 'path';
import jsonata from 'jsonata';

export const BASE_PATH = path.resolve(import.meta.dirname, '..');
export const TRANSFORMS_PATH = path.join(BASE_PATH, 'transforms');
export const DIST_PATH = path.join(BASE_PATH, 'dist');
export const ASSETS_PATH = path.join(BASE_PATH, 'assets');

// File cache for performance optimization
const fileCache = new Map();

/** Clears the file cache (useful for testing or when files might change). */
export const clearFileCache = () => fileCache.clear();

/** Reads a file once and cache the result for subsequent reads. */
export const readFileOnce = (filePath) => {
  if (!fileCache.has(filePath)) {
    try {
      fileCache.set(filePath, fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
  return fileCache.get(filePath);
};

/** Cleans a JSONata expression by removing comments, newlines, quotes, and extra spaces. */
export const cleanJsonata = (expr) => {
  return removeComments(expr)
    .replace(/\n+/g, '')
    .replace(/"/g, "'")
    .replace(/\s{4,}/g, '');
};

/** Removes block comments from JSONata expressions. */
export const removeComments = (expr) => {
  return expr.replace(/\/\*[\s\S]*?\*\//g, '');
};

/** Ensures a directory exists, creating it if necessary. */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/** Deletes a directory and all its contents. */
export const deleteDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
};

/** Writes content to a file with error handling and directory creation. */
export const writeFile = (filePath, content, successMessage) => {
  try {
    const dir = path.dirname(filePath);
    ensureDirectoryExists(dir);

    fs.writeFileSync(filePath, content);

    if (successMessage) console.log(successMessage);
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
};

export const isValidJsonata = (expr) => {
  try {
    jsonata(expr);
    return true;
  } catch {
    return false;
  }
};

export const lintJsonata = (expr) => {
  if (!isValidJsonata(expr)) throw new Error('Invalid JSONata expression');
  return cleanJsonata(expr);
};
