import { useState, useRef, useEffect } from 'react';
import { Loader2, Copy, ChevronUp, Clock, Archive, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionBarProps {
  saving: boolean;
  onCancel: () => void;
  onDuplicate: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-2 py-2 rounded-full flex items-center gap-2 shadow-2xl border-foreground/">
      <button 
        onClick={onCancel}
        disabled={saving}
        className="text-foreground/ hover:text-foreground px-4 py-2 rounded-full hover:bg-foreground/ text-sm font-medium transition-colors"
      >
        Cancel
      </button>

      <button 
        onClick={onDuplicate}
        disabled={saving}
        title="Duplicate Product"
        className="text-foreground/ hover:text-foreground px-3 py-2 rounded-full hover:bg-foreground/ text-sm font-medium transition-colors flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
      </button>
      
      <div className="h-6 w-px bg-foreground/ mx-2" />
      
      <button 
        onClick={onSaveDraft}
        disabled={saving}
        className="bg-foreground/ hover:bg-foreground/ text-foreground px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
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
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-[#1a1a1a] border border-foreground/ rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <button 
              onClick={() => { onPublish(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-foreground/ flex items-center gap-3 transition-colors"
            >
              <Send className="w-4 h-4 text-luxe-accent" />
              Publish Now
            </button>
            <button 
              onClick={() => { onSchedule(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-foreground/ flex items-center gap-3 transition-colors border-t border-foreground/"
            >
              <Clock className="w-4 h-4 text-blue-400" />
              Schedule...
            </button>
            <button 
              onClick={() => { onSaveDraft(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-foreground/ flex items-center gap-3 transition-colors border-t border-foreground/"
            >
              <FileText className="w-4 h-4 text-yellow-400" />
              Save as Draft
            </button>
            <button 
              onClick={() => { onArchive(); setShowPublishMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-foreground/"
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
