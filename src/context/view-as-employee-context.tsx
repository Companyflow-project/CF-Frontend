import React, { createContext, useContext, useState, useCallback } from 'react';

interface ViewAsEmployeeContextType {
  viewAsEmployee: boolean;
  toggleViewAsEmployee: () => void;
  exitEmployeeView: () => void;
}

const ViewAsEmployeeContext = createContext<ViewAsEmployeeContextType | undefined>(undefined);

export const ViewAsEmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewAsEmployee, setViewAsEmployee] = useState(false);

  const toggleViewAsEmployee = useCallback(() => {
    setViewAsEmployee((prev) => !prev);
  }, []);

  const exitEmployeeView = useCallback(() => {
    setViewAsEmployee(false);
  }, []);

  return (
    <ViewAsEmployeeContext.Provider value={{ viewAsEmployee, toggleViewAsEmployee, exitEmployeeView }}>
      {children}
    </ViewAsEmployeeContext.Provider>
  );
};

export const useViewAsEmployee = () => {
  const context = useContext(ViewAsEmployeeContext);
  if (context === undefined) {
    throw new Error('useViewAsEmployee must be used within a ViewAsEmployeeProvider');
  }
  return context;
};
