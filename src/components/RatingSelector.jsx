import React from 'react';
import { Star } from 'lucide-react';

export default function RatingSelector({ label, value, onChange }) {
    const totalStars = 5;
    
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex gap-1">
                {[...Array(totalStars)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <button
                            type="button"
                            key={ratingValue}
                            onClick={() => onChange(ratingValue)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-6 h-6 cursor-pointer transition-colors ${
                                    ratingValue <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}