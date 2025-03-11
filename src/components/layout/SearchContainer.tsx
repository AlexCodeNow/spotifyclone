'use client';

import React from 'react';

interface SearchContainerProps {
  children: React.ReactNode;
}

export default function SearchContainer({ children }: SearchContainerProps) {
  
  React.useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  
  return (
    <div className="search-results-container">
      {children}
      
      <style jsx global>{`
        body.search-page {
          overflow: hidden !important;
        }
        
        .search-results-container {
          padding-bottom: 5rem; /* Equivalente a pb-20 en Tailwind */
        }
      `}</style>
    </div>
  );
}