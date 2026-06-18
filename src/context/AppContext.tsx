import React, { createContext, useContext } from 'react';

export const AppContext = createContext<any>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
