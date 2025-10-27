import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : 'quiz-website';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
  base: isDev ? '/' : `/${repoName}/`
});

