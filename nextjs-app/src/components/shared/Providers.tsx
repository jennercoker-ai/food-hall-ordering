'use client';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Zustand store is auto-initialised on import — no wrapper needed.
  // Add React-Query, Theme, or Auth providers here as needed.
  return <>{children}</>;
}
