import { getProviders, signIn } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  // Redirect if already signed in
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600 mt-2">Consulting Dashboard</p>
        </div>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/dashboard' });
          }}
          className="space-y-4"
        >
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Sign In with Google
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Automated metrics for medical practices and consulting clients
          </p>
        </div>
      </div>
    </div>
  );
}
