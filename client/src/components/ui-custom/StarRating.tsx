import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({ rating, size = 16, showValue = false, reviewCount }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            size={size}
            className="fill-[#B8860B] text-[#B8860B]"
          />
        ))}
        {hasHalfStar && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="absolute text-gray-300"
            />
            <div className="absolute overflow-hidden" style={{ width: size / 2 }}>
              <Star
                size={size}
                className="fill-[#B8860B] text-[#B8860B]"
              />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={size}
            className="text-gray-300"
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-[#6B6B80] ml-1">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount.toLocaleString()} reviews)`}
        </span>
      )}
    </div>
  );
}
