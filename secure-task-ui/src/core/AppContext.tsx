import { createContext, useContext, type ReactNode } from 'react';
import { AppController } from './AppController';

const AppContext = createContext<AppController | null>(null);

export function AppProvider({ children, controller }: { children: ReactNode; controller: AppController }) {
  return <AppContext.Provider value={controller}>{children}</AppContext.Provider>;
}

export function useAppController() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppController must be used within an AppProvider');
  }

  return context;
}
