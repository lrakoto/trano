import React, { createContext, useContext, useState } from 'react';

interface DrawerCtx {
  open:        boolean;
  openDrawer:  () => void;
  closeDrawer: () => void;
}

const Ctx = createContext<DrawerCtx>({
  open:        false,
  openDrawer:  () => {},
  closeDrawer: () => {},
});

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useDrawer = () => useContext(Ctx);
