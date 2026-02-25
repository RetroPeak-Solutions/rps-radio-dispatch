// app/context/LoadingContext.tsx
import React, { createContext, useContext, useState,  type ReactNode } from "react";

// 1️⃣ Define the shape of the context
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (state: boolean) => void;
}

// 2️⃣ Create the context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// 3️⃣ Provider props
interface LoadingProviderProps {
  children: ReactNode;
}

// 4️⃣ Provider component
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  const setLoading = (state: boolean) => {
    // return;
    setIsLoading(state);
  }

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// 5️⃣ Custom hook to consume the context
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};