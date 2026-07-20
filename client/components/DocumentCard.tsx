'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Doc {
  _id: string;
  title: string;
  updatedAt: string;
  owner?: { name: string; email: string };
}

interface Props {
  doc: Doc;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export default function DocumentCard({ doc, isOwner, onDelete, onRename }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);

  const handleRename = async () => {
    if (!title.trim() || title === doc.title) {
      setEditing(false);
      setTitle(doc.title);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/documents/${doc._id}`, { title: title.trim() });
      onRename(doc._id, title.trim());
    } catch {
      setTitle(doc.title); // revert on error
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${doc._id}`);
      onDelete(doc._id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formattedDate = new Date(doc.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group flex flex-col gap-2">
      {/* Document icon + title */}
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => !editing && router.push(`/document/${doc._id}`)}
      >
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setEditing(false); setTitle(doc.title); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={saving}
            />
          ) : (
            <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Edited {formattedDate}</p>
          {doc.owner && (
            <p className="text-xs text-gray-400">by {doc.owner.name}</p>
          )}
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition pt-1 border-t border-gray-100">
        <button
          onClick={() => router.push(`/document/${doc._id}`)}
          className="text-xs text-indigo-600 hover:underline"
        >
          Open
        </button>
        {isOwner && (
          <>
            <span className="text-gray-300">|</span>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className="text-xs text-gray-500 hover:text-indigo-600"
            >
              Rename
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
