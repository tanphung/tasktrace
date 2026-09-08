import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],test:{environment:'jsdom',include:['tests/live/**/*.test.tsx'],setupFiles:['tests/frontend/setup.ts'],testTimeout:1_800_000,hookTimeout:60_000,fileParallelism:false}});
