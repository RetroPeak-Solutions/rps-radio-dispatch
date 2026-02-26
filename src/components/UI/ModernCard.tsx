import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ModernCardProps = {
  isDestructive?: Boolean;
  isWarning?: Boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  hoverScale?: number;
};

export default function ModernCard({
  isDestructive = false,
  isWarning = false,
  children,
  className = "",
  contentClassName = "",
  hoverScale = 1.04,
}: ModernCardProps) {
  return (
    <motion.div
      whileHover={{ scale: hoverScale }}
      className={`relative rounded-2xl p-px ${isDestructive ? 'bg-[#EF4343]/5 border-[#EF4343]/20': isWarning ? 'bg-transparent' : 'bg-linear-to-r from-[#3C83F6] via-purple-500 to-pink-500' }  ${className}`}
    >
      <div
        className={`${isDestructive ? 'bg-[#EF4343]/5 border-[#EF4343]/20 border' : isWarning ? "border bg-yellow-100/50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300/50 dark:border-yellow-300/50" : "bg-[#111827]/90"} backdrop-blur-xl rounded-2xl p-6 shadow-xl h-full ${contentClassName}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
