import antfu from '@antfu/eslint-config'
// import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
// https://github.com/antfu/eslint-config/issues/631#issuecomment-2965427766
// https://github.com/antfu/eslint-config/issues/767
// import eslintPluginOxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    vue: true,
    typescript: true,
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
    // Disable UnoCSS since we're using Tailwind CSS
    unocss: false,
    ignores: ['dist/**', 'migrations/**', '**/*.md', '**/package.json', '**/tsconfig.json'],
  },
  {
    // Global rules
    rules: {
      'ts/no-redeclare': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'no-console': ['warn'],
      'antfu/no-top-level-await': 'off',
      'node/prefer-global/process': 'off',
      'node/no-process-env': ['error'],
      // 'perfectionist/sort-imports': ['error', {
      //   tsconfigRootDir: '.',
      // }],
      'unicorn/filename-case': ['error', {
        case: 'kebabCase',
        ignore: [/\.md$/],
      }],
      // // Prevent barrel files (index.ts re-exports)
      // 'no-restricted-syntax': [
      //   'error',
      //   {
      //     selector: 'ExportAllDeclaration',
      //     message: 'Barrel files (export * from) are not allowed. Use direct imports instead.',
      //   },
      //   {
      //     selector: 'ExportNamedDeclaration[source.value=/index$/]',
      //     message: 'Barrel files (importing from index) are not allowed. Use direct imports instead.',
      //   },
      // ],
      // // Prevent imports from barrel files and relative imports
      // 'no-restricted-imports': [
      //   'error',
      //   {
      //     patterns: [
      //       {
      //         group: ['**/index', '**/index.ts', '**/index.js'],
      //         message: 'Barrel files (index imports) are not allowed. Import directly from the source file.',
      //       },
      //       {
      //         group: ['@/features/*/index', '@/shared/*/index'],
      //         message: 'Barrel files are not allowed. Import directly from the source file.',
      //       },
      //       {
      //         group: ['@/features/*/index*'],
      //         message: 'Barrel files are not allowed. Import directly from the source file.',
      //       },
      //       {
      //         group: ['!@/shared/components/ui', '!@/shared/components/ui/**'],
      //         message: 'UI components are allowed to use barrel files.',
      //       },
      //       // Disallow relative imports, enforce @/ usage
      //       {
      //         group: ['./*', '../*'],
      //         message: 'Relative imports are not allowed. Use the @/ alias for all project imports.',
      //       },
      //     ],
      //     paths: [],
      //   },
      // ],
    },
  },
  // Exception for UI components - allow barrel files
  // {
  //   files: ['src/shared/components/ui/**/*'],
  //   rules: {
  //     'no-restricted-syntax': 'off',
  //     'no-restricted-imports': 'off',
  //   },
  // },
  // MUST be after global rules to override
  {
    // Better Tailwind CSS plugin
    plugins: {
      // 'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      // Better Tailwind CSS rules
      // ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      // 'better-tailwindcss/no-unregistered-classes': 'off',
    },
    settings: {
      // 'better-tailwindcss': {
      //   entryPoint: 'src/assets/main.css',
      // },
    },
  },
  // eslintPluginOxlint.configs['flat/recommended'],
)