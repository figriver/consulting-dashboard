import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Consulting Dashboard
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Real-time metrics for your consulting clients
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-slate-400">Sign in to get started</p>
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Sign In with Google
            </Link>
          </div>

          <div className="mt-16 text-slate-400 text-sm">
            <p>Automated metrics for medical practices and consulting clients</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already signed in
  redirect('/dashboard');
}
