// src/components/map/SummaryListWrapper.tsx
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SummaryListWrapperProps {
  children: ReactNode;
}

export default function SummaryListWrapper({
  children,
}: SummaryListWrapperProps) {
  return (
    <div className="w-full border-t border-slate-200 bg-white">
      <div className="custom-scrollbar max-h-[35vh] min-h-[20vh] w-full overflow-y-auto px-8 py-5">
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col gap-2.5"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
