// src/components/filters/FilterSection.tsx
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function FilterSection({
  title,
  defaultOpen = false,
  children,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="px-5 py-4 border-b border-slate-200">
      <button
        className="flex items-center gap-2 w-full text-left text-slate-600 hover:text-black transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        />
        <h2 className="text-xs font-semibold tracking-wider">{title}</h2>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
