// app/components/LoadingOverlay.tsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "../../context/Loading";

export const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  // Prevent scrolling & text selection
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.userSelect = "";
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Underlying page dim + blur */}
          <motion.div
            key="page-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm pointer-events-none"
          />

          {/* Full-screen loading overlay */}
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
          >
            {/* Subtle background glows */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto select-none">
              <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slow" />
              <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-slow" />
            </div>

            {/* Centered spinner & text */}
            <div className="relative z-10 flex flex-col items-center pointer-events-auto">
              {/* Gradient Spinner */}
              <div className="w-16 h-16 rounded-full border-4 border-t-transparent border-b-transparent border-l-blue-500 border-r-indigo-500 animate-spin" />

              {/* Gradient Text */}
              <p className="mt-4 text-lg font-medium select-none text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse">
                Loading...
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};