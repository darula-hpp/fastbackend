import { ThemeToggle } from '../app/ThemeToggle';
import { VersionBadge } from '../app/VersionBadge';
import { SearchDialog } from './docs/SearchDialog';

interface SiteHeaderProps {
  variant: 'marketing' | 'docs';
}

export function SiteHeader({ variant }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur"
      />

      <div className="relative flex items-center gap-3 px-6 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            className="text-lg font-semibold tracking-tight hover:text-[var(--primary)] transition-colors"
          >
            FastBackend
          </a>
          <VersionBadge />
        </div>

        {variant === 'docs' && (
          <div className="flex-1 max-w-xl mx-auto">
            <SearchDialog />
          </div>
        )}

        {variant === 'marketing' && <div className="flex-1" />}

        <div className="flex items-center gap-4 shrink-0">
          {variant === 'marketing' && (
            <a
              href="/docs"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors"
            >
              Docs
            </a>
          )}
          <a
            href="https://github.com/darula-hpp/fastbackend"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors"
          >
            GitHub →
          </a>
          {variant === 'docs' && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
