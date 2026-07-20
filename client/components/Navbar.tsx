'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
        CollabDocs
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.name}
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
