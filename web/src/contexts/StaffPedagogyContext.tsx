'use client';

import { createContext, useContext } from 'react';

const StaffPedagogyReadOnlyContext = createContext(false);

export function StaffPedagogyReadOnlyProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return (
    <StaffPedagogyReadOnlyContext.Provider value={value}>{children}</StaffPedagogyReadOnlyContext.Provider>
  );
}

export function useStaffPedagogyReadOnly(): boolean {
  return useContext(StaffPedagogyReadOnlyContext);
}
