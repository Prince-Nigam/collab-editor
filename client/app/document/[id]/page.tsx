'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import EditorToolbar from '@/components/EditorToolbar';
import ShareModal from '@/components/ShareModal';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface DocData {
  _id: string;
  title: string;
  content: object;
  owner: { _id: string; name: string; email: string };
  sharedWith: { user: { _id: string; name: string }; permission: string }[];
}

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [doc, setDoc] = useState<DocData | null>(null);
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showShare, setShowShare] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Debounce timer ref — we don't want to re-render on every keystroke
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if content has been loaded into editor (prevent double-load)
  const contentLoaded = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      // Every time content changes, debounce a save
      setSaveStatus('unsaved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveContent(editor.getJSON());
      }, 1500); // save 1.5s after last keystroke
    },
  });

  // Save content to backend
  const saveContent = useCallback(
    async (content: object) => {
      if (!id) return;
      setSaveStatus('saving');
      try {
        await api.put(`/documents/${id}`, { content });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [id]
  );

  // Save title on blur or Enter
  const saveTitle = async (newTitle: string) => {
    setEditingTitle(false);
    if (!newTitle.trim() || newTitle === doc?.title) return;
    try {
      await api.put(`/documents/${id}`, { title: newTitle.trim() });
      setTitle(newTitle.trim());
      setDoc((prev) => prev ? { ...prev, title: newTitle.trim() } : prev);
    } catch {
      setTitle(doc?.title || 'Untitled Document');
    }
  };

  // Load document on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDoc = async () => {
      try {
        const { data } = await api.get(`/documents/${id}`);
        const fetchedDoc: DocData = data.document;
        setDoc(fetchedDoc);
        setTitle(fetchedDoc.title);
        setIsOwner(fetchedDoc.owner._id === user._id);

        // Load content into editor once
        if (editor && !contentLoaded.current) {
          editor.commands.setContent(fetchedDoc.content as any);
          contentLoaded.current = true;
        }
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'Failed to load document');
      }
    };

    fetchDoc();
  }, [authLoading, user, id, editor]);

  // When editor becomes ready after doc is loaded
  useEffect(() => {
    if (editor && doc && !contentLoaded.current) {
      editor.commands.setContent(doc.content as any);
      contentLoaded.current = true;
    }
  }, [editor, doc]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // File import handler
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Replace editor content with imported content
      editor?.commands.setContent(data.content);
      setSaveStatus('unsaved');

      // Suggest the filename as title if current title is Untitled
      if (title === 'Untitled Document' && data.title) {
        setTitle(data.title);
        await api.put(`/documents/${id}`, { title: data.title, content: data.content });
        setSaveStatus('saved');
      } else {
        // Save imported content
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveContent(data.content);
        }, 500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to import file');
    }
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  const saveStatusDisplay = {
    saved: <span className="text-green-600 text-xs">✓ Saved</span>,
    saving: <span className="text-gray-400 text-xs animate-pulse">Saving...</span>,
    unsaved: <span className="text-amber-500 text-xs">● Unsaved</span>,
    error: <span className="text-red-500 text-xs">✕ Save failed</span>,
  };

  if (authLoading) return null;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{loadError}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-10">
        {/* Left: back + title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
            title="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Editable title */}
          {editingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => saveTitle(title)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle(title);
                if (e.key === 'Escape') {
                  setTitle(doc?.title || '');
                  setEditingTitle(false);
                }
              }}
              className="text-lg font-semibold text-gray-900 bg-white border-b-2 border-indigo-400 focus:outline-none min-w-0 flex-1"
            />
          ) : (
            <h1
              className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-indigo-600 transition"
              onClick={() => isOwner && setEditingTitle(true)}
              title={isOwner ? 'Click to rename' : title}
            >
              {title || 'Untitled Document'}
            </h1>
          )}
        </div>

        {/* Right: save status + actions */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {saveStatusDisplay[saveStatus]}

          {/* File upload */}
          <label
            className="cursor-pointer text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-3 py-1.5 transition hover:border-indigo-400"
            title="Import .txt or .md file"
          >
            ↑ Import
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          {/* Share — owner only */}
          {isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
            >
              Share
            </button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content area */}
      <div className="flex-1 max-w-4xl w-full mx-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Share modal */}
      {showShare && doc && (
        <ShareModal docId={doc._id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
