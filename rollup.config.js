import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/handler.ts',
  output: { file: 'dist/handler.js', format: 'esm' },
  external: ['jsonata'],
  plugins: [typescript()],
};
