import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    const isUmd = mode === 'umd';

    return {
        build: {
            emptyOutDir: !isUmd,
            lib: {
                entry: 'src/index.js',
                name: 'F5',
            },
            minify: false,
            outDir: 'dist',
            rolldownOptions: {
                output: isUmd ? [
                    {
                        entryFileNames: 'f5.js',
                        format: 'umd',
                        minify: false,
                        name: 'F5',
                    },
                    {
                        entryFileNames: 'f5.min.js',
                        format: 'umd',
                        minify: true,
                        name: 'F5',
                    },
                ] : [
                    {
                        entryFileNames: 'f5.esm.js',
                        format: 'es',
                        minify: false,
                    },
                    {
                        entryFileNames: 'f5.esm.min.js',
                        format: 'es',
                        minify: true,
                    },
                ],
            },
            sourcemap: true,
            target: 'baseline-widely-available',
        },
    };
});
