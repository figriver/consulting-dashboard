import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header session={session} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
