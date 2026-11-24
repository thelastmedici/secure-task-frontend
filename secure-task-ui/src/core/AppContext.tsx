import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import { AppController } from './AppController';

type AppStoreState = {
  controller: AppController;
  revision: number;
};

const AppStoreContext = createContext<StoreApi<AppStoreState> | null>(null);

export function AppProvider({ children, controller }: { children: ReactNode; controller: AppController }) {
  const store = useMemo(() => createStore<AppStoreState>(() => ({ controller, revision: 0 })), [controller]);

  useEffect(() => controller.subscribe(() => {
    store.setState((state) => ({ revision: state.revision + 1 }));
  }), [controller, store]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppController() {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error('useAppController must be used within an AppProvider');
  }

  useStore(store, (state) => state.revision);
  return useStore(store, (state) => state.controller);
}
