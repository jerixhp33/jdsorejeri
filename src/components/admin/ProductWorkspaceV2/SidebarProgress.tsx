import { SECTIONS } from './constants';
import { cn } from '@/lib/utils';

interface SidebarProgressProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function SidebarProgress({ activeSection, onSectionClick }: SidebarProgressProps) {
  return (
    <div className="w-64 flex-shrink-0 hidden lg:block border-r border-white/10 p-6 overflow-y-auto">
      <h2 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Product Details</h2>
      <nav className="space-y-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
              activeSection === section.id
                ? "bg-luxe-accent/10 text-luxe-accent font-medium"
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
