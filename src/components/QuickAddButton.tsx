'use client';

import React from 'react';

interface QuickAddButtonProps {
  onClick: () => void;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out transform hover:scale-105"
    >
      <span className="text-3xl font-light">+</span>
    </button>
  );
};
