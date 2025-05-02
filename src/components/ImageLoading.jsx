// Add this component to your file, preferably at the top before the main Todo component

import { useContext, useState } from "react";
import { ThemeContext } from "../App";

export default function ImageWithLoading  ({ imageUrl }) {
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useContext(ThemeContext);
  
    return (
      <div className="relative w-full h-full">
        {/* Loading State */}
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-md`}>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Actual Image */}
        <img 
          src={imageUrl} 
          alt="Task Image" 
          className={`w-full max-h-[160px] rounded-md object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>
    );
  };