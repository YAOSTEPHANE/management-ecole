'use client';

import React, { createContext, useContext } from 'react';
import {
  adminDigitalLibraryManagementApi,
  adminLibraryManagementApi,
  type DigitalLibraryManagementApi,
  type LibraryManagementApi,
  staffDigitalLibraryManagementApi,
  staffLibraryManagementApi,
} from '@/services/api/libraryManagement.api';

type LibraryManagementContextValue = {
  scope: 'admin' | 'staff';
  libraryApi: LibraryManagementApi;
  digitalApi: DigitalLibraryManagementApi;
};

const defaultValue: LibraryManagementContextValue = {
  scope: 'admin',
  libraryApi: adminLibraryManagementApi,
  digitalApi: adminDigitalLibraryManagementApi,
};

const LibraryManagementContext = createContext<LibraryManagementContextValue>(defaultValue);

export function LibraryManagementProvider({
  scope = 'admin',
  children,
}: {
  scope?: 'admin' | 'staff';
  children: React.ReactNode;
}) {
  const value: LibraryManagementContextValue =
    scope === 'staff'
      ? {
          scope: 'staff',
          libraryApi: staffLibraryManagementApi,
          digitalApi: staffDigitalLibraryManagementApi,
        }
      : defaultValue;

  return (
    <LibraryManagementContext.Provider value={value}>{children}</LibraryManagementContext.Provider>
  );
}

export function useLibraryManagement() {
  return useContext(LibraryManagementContext);
}
