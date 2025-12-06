import { useState } from 'react';

export const useModals = () => {
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isVectorModalOpen, setIsVectorModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const closeAllModals = () => {
    setIsGenModalOpen(false);
    setIsVectorModalOpen(false);
    setIsHelpOpen(false);
  };

  return {
    isGenModalOpen,
    setIsGenModalOpen,
    isVectorModalOpen,
    setIsVectorModalOpen,
    isHelpOpen,
    setIsHelpOpen,
    closeAllModals,
  };
};

