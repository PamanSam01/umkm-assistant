import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  autoReplyEnabled: boolean;
  setAutoReplyEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  return (
    <AppContext.Provider value={{ autoReplyEnabled, setAutoReplyEnabled }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
