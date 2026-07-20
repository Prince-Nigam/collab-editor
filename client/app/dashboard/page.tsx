'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import DocumentCard from '@/components/DocumentCard';

interface Doc {
  _id: string;
  title: string;
  updatedAt: string;
  owner?: { _id: string; name: string; email: string };
}

type Tab = 'my' | 'shared';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('my');
  const [myDocs, setMyDocs] = useState<Doc[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Wait for auth to resolve before fetching
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDocuments();
  }, [authLoading, user]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const [myRes, sharedRes] = await Promise.all([
        api.get('/documents'),
        api.get('/documents/shared'),
      ]);
      setMyDocs(myRes.data.documents);
      setSharedDocs(sharedRes.data.documents);
    } catch (err: any) {
      setError('Failed to load documents. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document' });
      router.push(`/document/${data.document._id}`);
    } catch {
      alert('Failed to create document');
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setMyDocs((prev) => prev.filter((d) => d._id !== id));
  };

  const handleRename = (id: string, title: string) => {
    setMyDocs((prev) => prev.map((d) => (d._id === id ? { ...d, title } : d)));
  };

  // Show nothing until auth resolved (prevents flash)
  if (authLoading) return null;

  const activeDocs = tab === 'my' ? myDocs : sharedDocs;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {creating ? 'Creating...' : 'New Document'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setTab('my')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              tab === 'my'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Documents
            <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
              {myDocs.length}
            </span>
          </button>
          <button
            onClick={() => setTab('shared')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              tab === 'shared'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Shared with me
            <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
              {sharedDocs.length}
            </span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={fetchDocuments} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        {/* Document Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeDocs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-gray-700 font-medium mb-1">
              {tab === 'my' ? 'No documents yet' : 'Nothing shared with you yet'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {tab === 'my' ? 'Create your first document to get started.' : 'Documents shared with you will appear here.'}
            </p>
            {tab === 'my' && (
              <button
                onClick={handleCreateDocument}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeDocs.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                isOwner={tab === 'my'}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
