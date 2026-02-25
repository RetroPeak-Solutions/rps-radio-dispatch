import React from "react";
interface WrapperProps {
    children: React.ReactNode
}

export default function PageWrapper({ children }: WrapperProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-900 via-gray-950 to-black text-white  p-6">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          {children}
        </div>
    );
}