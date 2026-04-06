import { TriangleAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface RefreshSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Logout({ isOpen, onClose }: RefreshSystemModalProps) {
  const { logout } = useAuth();

  return (
    <>
      {/* MODAL DE CERRAR SESION */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
              initial={{ scale: 0.9, opacity: 0, x: -400 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <TriangleAlert className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ¿Cerrar Sesión?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  ¿Estás seguro? Tendrás que volver a ingresar tus credenciales.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Salir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
