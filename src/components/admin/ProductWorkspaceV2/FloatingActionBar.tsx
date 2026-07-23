import { useState, useRef, useEffect } from 'react';
import { Loader2, Copy, ChevronUp, Clock, Archive, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionBarProps {
  saving: boolean;
  onCancel: () => void;
  onDuplicate: () => void;
  onSaveDraft: () => void;
  onPublish: (notify?: boolean) => void;
  onSchedule: () => void;
  onArchive: () => void;
}

export function FloatingActionBar({ 
  saving, 
  onCancel, 
  onDuplicate, 
  onSaveDraft, 
  onPublish,
  onSchedule,
  onArchive
}: FloatingActionBarProps) {
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPublishMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-2 py-2 rounded-full flex items-center gap-2 shadow-2xl border-white/20">
      <button 
        onClick={onCancel}
        disabled={saving}
        className="text-white/60 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 text-sm font-medium transition-colors"
      >
        Cancel
      </button>

      <button 
        onClick={onDuplicate}
        disabled={saving}
        title="Duplicate Product"
        className="text-white/60 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 text-sm font-medium transition-colors flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
      </button>
      
      <div className="h-6 w-px bg-white/10 mx-2" />
      
      <button 
        onClick={onSaveDraft}
        disabled={saving}
        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Draft
      </button>
      
      {/* Publish Dropdown */}
      <div className="relative" ref={menuRef}>
        <div className="flex items-center">
          <button 
            onClick={onPublish}
            disabled={saving}
            className="bg-luxe-accent hover:bg-luxe-accent/90 text-black px-5 py-2 rounded-l-full text-sm font-medium transition-colors flex items-center gap-2 border-r border-black/10"
          >
            Publish Now
          </button>
          <button 
            onClick={() => setShowPublishMenu(!showPublishMenu)}
            disabled={saving}
            className="bg-luxe-accent hover:bg-luxe-accent/90 text-black px-3 py-2 rounded-r-full text-sm font-medium transition-colors flex items-center justify-center"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showPublishMenu && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <button 
              onClick={() => { onPublish(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
              <Send className="w-4 h-4 text-luxe-accent" />
              Publish Now
            </button>
            <button 
              onClick={() => { onPublish(true); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors border-t border-white/5"
            >
              <Send className="w-4 h-4 text-purple-400" />
              Publish & Notify Users
            </button>
            <button 
              onClick={() => { onSchedule(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors border-t border-white/5"
            >
              <Clock className="w-4 h-4 text-blue-400" />
              Schedule...
            </button>
            <button 
              onClick={() => { onSaveDraft(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors border-t border-white/5"
            >
              <FileText className="w-4 h-4 text-yellow-400" />
              Save as Draft
            </button>
            <button 
              onClick={() => { onArchive(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
