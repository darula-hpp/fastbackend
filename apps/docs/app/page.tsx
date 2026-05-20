import { SiteHeader } from '../components/SiteHeader';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-[var(--font-geist-sans,sans-serif)]">
      <SiteHeader variant="marketing" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 max-w-3xl">
          A Runtime <span className="text-[var(--primary)]">for Backend APIs</span>
        </h1>

        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-lg mb-10 leading-relaxed">
          A backend runtime, not a codegen tool. Point FastBackend at a SQLAlchemy or Prisma schema — it serves CRUD routes, relationships, and OpenAPI at runtime. Routes live in memory, not on disk.
        </p>

        <div className="w-full max-w-lg mb-10">
          <div className="bg-gray-950 dark:bg-gray-900 rounded-xl border border-gray-800 overflow-hidden text-left shadow-xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-800">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <pre className="px-5 py-4 text-sm text-gray-100 overflow-x-auto">
              <code>
                <span className="text-gray-500">$</span>{' '}
                <span className="text-[var(--primary)]">fastbackend</span>{' '}
                <span className="text-white">init</span>{' '}
                <span className="text-yellow-300">my-api --schema sqlalchemy</span>
                {'\n'}
                <span className="text-gray-500">
                  # → Scaffolds schema, config, and custom endpoints
                </span>
                {'\n\n'}
                <span className="text-gray-500">$</span>{' '}
                <span className="text-[var(--primary)]">fastbackend</span>{' '}
                <span className="text-white">generate && fastbackend dev</span>
                {'\n'}
                <span className="text-gray-500">
                  # → Your API is live at http://localhost:8301/docs
                </span>
              </code>
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/docs/getting-started/introduction"
            className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg font-medium transition-colors text-sm"
          >
            Read the docs
          </a>
          <a
            href="https://github.com/darula-hpp/fastbackend"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 border border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg font-medium transition-colors text-sm"
          >
            View on GitHub
          </a>
        </div>
      </main>

      <section className="px-6 py-16 border-t border-[var(--border)]" aria-label="Features">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8 text-center">
            Everything you need from a schema-driven backend
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-transparent"
              >
                <div className="w-8 h-8 mb-3 text-[var(--primary)]">
                  <feature.icon />
                </div>
                <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-t border-[var(--border)] bg-gray-50 dark:bg-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">What&apos;s shipping</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Core IR engine, FastAPI runtime, and CLI are ready for local development.
          </p>
          <ul className="text-left space-y-3 max-w-sm mx-auto">
            {roadmap.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    item.done
                      ? 'bg-teal-100 dark:bg-teal-900/40 text-[var(--primary)]'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  {item.done ? '✓' : '·'}
                </span>
                <span className={item.done ? '' : 'text-gray-400 dark:text-gray-500'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="px-6 py-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} FastBackend</span>
        <div className="flex gap-4">
          <a
            href="https://github.com/darula-hpp/fastbackend"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--primary)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="/docs/getting-started/introduction"
            className="hover:text-[var(--primary)] transition-colors"
          >
            Docs
          </a>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    title: 'IR + OpenAPI on disk',
    description:
      'The CLI writes `.fastbackend/ir.json` and OpenAPI from your schema. No CRUD route code is written to disk.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: 'Runtime routes',
    description:
      'FastAPI and Express adapters register CRUD, relationships, and validation at startup from IR.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      </svg>
    ),
    title: 'Schema formats',
    description: 'SQLAlchemy and Prisma parsers produce the same IR. More formats planned.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <line x1="4" x2="4" y1="21" y2="14" />
        <line x1="4" x2="4" y1="10" y2="3" />
        <line x1="12" x2="12" y1="21" y2="12" />
        <line x1="12" x2="12" y1="8" y2="3" />
        <line x1="20" x2="20" y1="21" y2="16" />
        <line x1="20" x2="20" y1="12" y2="3" />
        <line x1="2" x2="6" y1="14" y2="14" />
        <line x1="10" x2="14" y1="8" y2="8" />
        <line x1="18" x2="22" y1="16" y2="16" />
      </svg>
    ),
    title: 'Override system',
    description:
      'Replace any runtime CRUD route with custom handlers using the `@override` decorator.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Frontend integration',
    description:
      'OpenAPI output has first-class UIGen support for a complete frontend with overrides. Orval, openapi-typescript, and Hey API work too.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Docker ready',
    description: 'Scaffold Dockerfile templates with `fastbackend init --docker` and build with `docker:build`.',
  },
];

const roadmap = [
  { label: 'Core IR engine', done: true },
  { label: 'SQLAlchemy parser', done: true },
  { label: 'Prisma parser', done: true },
  { label: 'FastAPI runtime', done: true },
  { label: 'CLI (init, generate, dev)', done: true },
  { label: 'Custom endpoints + overrides', done: true },
  { label: 'Docs site', done: true },
  { label: 'Express runtime (Prisma)', done: true },
  { label: 'npm / PyPI publish', done: true },
  { label: 'Declarative services (storage, OAuth)', done: false },
  { label: 'Spring adapter', done: false },
];
