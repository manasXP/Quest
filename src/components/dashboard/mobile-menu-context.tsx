"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface MobileMenuContextType {
  menuContent: ReactNode | null;
  setMenuContent: (content: ReactNode | null) => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | null>(null);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [menuContent, setMenuContent] = useState<ReactNode | null>(null);

  return (
    <MobileMenuContext.Provider value={{ menuContent, setMenuContent }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    return { menuContent: null, setMenuContent: () => {} };
  }
  return context;
}
