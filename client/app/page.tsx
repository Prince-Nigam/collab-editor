import Link from 'next/link';

// Landing page — simple, fast, no auth needed
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-indigo-700 mb-4">CollabDocs</h1>
        <p className="text-xl text-gray-600 mb-8">
          A lightweight collaborative document editor. Create, edit, and share documents in real time.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
