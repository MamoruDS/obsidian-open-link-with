import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const isProd = (process.env.BUILD === 'production');

export default {
    input: 'src/main.ts',
    output: {
        dir: 'dist',
        sourcemap: 'inline',
        sourcemapExcludeSources: isProd,
        format: 'cjs',
        exports: 'default',
    },
    external: ['obsidian', 'child_process', 'fs', 'path', 'os'],
    plugins: [
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
    ]
};