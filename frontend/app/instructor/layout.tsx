import RequireAuth from '@/lib/providers/RequireAuth';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['instructor']}>{children}</RequireAuth>;
}
