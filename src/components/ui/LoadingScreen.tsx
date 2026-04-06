// src/components/ui/LoadingScreen.tsx
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="flex flex-col items-center"
      >
        <div className="">
          <LoaderCircle className="w-18 h-18 text-blue-600 animate-spin" />
        </div>
      </motion.div>
    </div>
  );
}
