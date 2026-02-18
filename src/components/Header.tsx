'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface HeaderProps {
  session: Session & {
    user?: {
      role?: string;
      clientId?: string;
    };
  };
}

export default function Header({ session }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-xl text-slate-900">
            Dashboard
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-slate-700 hover:text-slate-900 font-medium"
            >
              Metrics
            </Link>
            {session.user?.role === 'ADMIN' && (
              <Link
                href="/dashboard/admin"
                className="text-slate-700 hover:text-slate-900 font-medium"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            <p>{session.user?.email}</p>
            <p className="text-xs text-slate-500">
              {session.user?.role === 'ADMIN' ? 'Admin' : 'Client'}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-900 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
