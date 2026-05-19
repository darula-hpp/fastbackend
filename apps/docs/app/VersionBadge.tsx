import { getLatestRelease } from '../lib/changelog';

/**
 * Server component — reads version at build time, renders a minimal badge.
 */
export function VersionBadge() {
  const release = getLatestRelease();

  if (!release) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span className="font-mono">v0.1.0</span>
      </span>
    );
  }

  return (
    <a
      href="https://github.com/darula-hpp/uigen/tree/main/fastbackend"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-[var(--primary)] transition-colors"
    >
      <span className="font-mono">v{release.version}</span>
      <span className="text-gray-300 dark:text-gray-700">·</span>
      <span>{release.date}</span>
    </a>
  );
}
