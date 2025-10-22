import React from 'react';

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default AppProvider;
