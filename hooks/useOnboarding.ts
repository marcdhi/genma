import { useState, useEffect } from 'react';

export const useOnboarding = (view: 'landing' | 'app') => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (view === 'app') {
      const hasOnboarded = localStorage.getItem('genma_onboarded');
      if (!hasOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, [view]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('genma_onboarded', 'true');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    handleCloseOnboarding,
  };
};

