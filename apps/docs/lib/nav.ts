export interface NavPage {
  title: string;
  slug: string;
}

export interface NavSection {
  title: string;
  slug: string;
  pages: NavPage[];
}

export const nav: NavSection[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    pages: [
      { title: 'Introduction', slug: 'introduction' },
      { title: 'Quick Start', slug: 'quick-start' },
      { title: 'Installation', slug: 'installation' },
    ],
  },
  {
    title: 'Core Concepts',
    slug: 'core-concepts',
    pages: [
      { title: 'How It Works', slug: 'how-it-works' },
      { title: 'Intermediate Representation', slug: 'intermediate-representation' },
      { title: 'Runtime Architecture', slug: 'runtime-architecture' },
      { title: 'Express Runtime', slug: 'express-runtime-architecture' },
    ],
  },
  {
    title: 'Configuration',
    slug: 'configuration',
    pages: [{ title: 'Overview', slug: 'overview' }],
  },
  {
    title: 'CLI Reference',
    slug: 'cli-reference',
    pages: [
      { title: 'init', slug: 'init' },
      { title: 'generate', slug: 'generate' },
      { title: 'dev', slug: 'dev' },
      { title: 'build', slug: 'build' },
      { title: 'test', slug: 'test' },
      { title: 'migrate', slug: 'migrate' },
      { title: 'docker:build', slug: 'docker-build' },
    ],
  },
  {
    title: 'Custom Endpoints',
    slug: 'custom-endpoints',
    pages: [
      { title: 'Overview', slug: 'overview' },
      { title: 'Overrides', slug: 'overrides' },
    ],
  },
  {
    title: 'Migration',
    slug: 'migration',
    pages: [{ title: 'Existing Projects', slug: 'existing-project' }],
  },
  {
    title: 'Testing',
    slug: 'testing',
    pages: [{ title: 'Overview', slug: 'overview' }],
  },
  {
    title: 'Troubleshooting',
    slug: 'troubleshooting',
    pages: [{ title: 'Common Issues', slug: 'common-issues' }],
  },
];
