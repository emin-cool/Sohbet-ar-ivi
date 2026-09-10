"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AdminContextProps {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  isDev: boolean;
  isAdminUser: boolean;
}

const AdminContext = createContext<AdminContextProps>({
  isAdminMode: false,
  toggleAdminMode: () => {},
  isDev: false,
  isAdminUser: false,
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isAdminUser = session?.user?.role === "ADMIN";
  const isAdminMode = isAdminUser;
  const isDev = process.env.NODE_ENV === "development";

  const toggleAdminMode = () => {
    // No-op now since we removed the button and it's automatic
  };

  return (
    <AdminContext.Provider value={{ isAdminMode, toggleAdminMode, isDev, isAdminUser }}>
      {children}

    </AdminContext.Provider>
  );
}
