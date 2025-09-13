import React from 'react';

// אייקון מותאם אישית של המקסיקני
export default function MexicanoIcon({ className = "w-6 h-6", color = "currentColor" }) {
    return (
        <svg 
            className={className} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* כובע מקסיקני מסוגנן */}
            <path 
                d="M12 3L8 8H16L12 3Z" 
                fill={color} 
                opacity="0.8"
            />
            {/* שוליים של הכובע */}
            <ellipse 
                cx="12" 
                cy="8" 
                rx="8" 
                ry="2" 
                fill={color} 
                opacity="0.6"
            />
            {/* חלק עליון של הכובע */}
            <circle 
                cx="12" 
                cy="6" 
                r="1.5" 
                fill={color}
            />
            {/* עיטורים */}
            <path 
                d="M6 8C6 8 8 9 12 9C16 9 18 8 18 8" 
                stroke={color} 
                strokeWidth="1.5" 
                fill="none"
                opacity="0.7"
            />
            {/* האות מ */}
            <text 
                x="12" 
                y="16" 
                textAnchor="middle" 
                fontSize="8" 
                fontWeight="bold" 
                fill={color}
            >
                מ
            </text>
        </svg>
    );
}