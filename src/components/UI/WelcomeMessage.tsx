// app/components/WelcomeMessage.tsx
import React from "react";
import type { User } from "../../lib/types";

interface WelcomeMessageProps {
  user?: Pick<User, "firstName" | "lastName"> & Partial<Omit<User, "firstName" | "lastName">> | null;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ user }) => {
  if (!user) return null;

  // Safely get first character of lastName
  const lastInitial =
    user.lastName && user.lastName.length > 0
      ? user.lastName[0].toUpperCase() + "."
      : "";

  return (
    <h1 className="text-center text-2xl font-bold my-5">
      Welcome, {user.firstName} {lastInitial}
    </h1>
  );
};