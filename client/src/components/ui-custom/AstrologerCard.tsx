import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Astrologer } from '@/types';

interface AstrologerCardProps {
    astrologer: Astrologer;
    onBook: (astrologer: Astrologer) => void;
}

const AstrologerCard = memo(({ astrologer, onBook }: AstrologerCardProps) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-[#2D1B69]/5 border border-gray-100 card-hover relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
                <img
                    src={astrologer.image}
                    alt={astrologer.name}
                    className="w-20 h-20 rounded-full object-cover border-3 border-[#D4A574]"
                    loading="lazy"
                />
                <div className="flex-1 pt-2">
                    <h3 className="font-serif text-xl font-bold text-[#2D1B69]">
                        {astrologer.name}
                    </h3>
                    <p className="text-sm text-[#6B6B80] mb-2">{astrologer.title}</p>
                </div>
            </div>

            {/* About / skills fallback */}
            <p className="text-sm text-[#6B6B80] mb-4 line-clamp-2">
                {astrologer.about ||
                  (astrologer.specializations.length > 0
                    ? astrologer.specializations.join(', ')
                    : 'Experienced astrologer.')}
            </p>

            {/* Specializations tags (if any) */}
            {astrologer.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                  {astrologer.specializations.slice(0, 3).map((spec: string, i: number) => (
                      <span
                          key={i}
                          className="px-3 py-1 bg-[#F5F2EB] rounded-full text-xs font-medium text-[#1A1A2E]"
                      >
                          {spec}
                      </span>
                  ))}
              </div>
            )}

            {/* Languages */}
            {astrologer.languages.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm text-[#6B6B80]">
                <Languages className="w-4 h-4" />
                <span>{astrologer.languages.join(', ')}</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
                <div className="text-center">
                    <span className="block font-bold text-[#4A1E8C]">
                        {astrologer.experience}+
                    </span>
                    <span className="text-xs text-[#6B6B80]">Years</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-[#4A1E8C]">
                        {(astrologer.consultations / 1000).toFixed(0)}K+
                    </span>
                    <span className="text-xs text-[#6B6B80]">Consults</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-[#4A1E8C]">
                        {astrologer.accuracy}%
                    </span>
                    <span className="text-xs text-[#6B6B80]">Accuracy</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end">
                <Link to="/booking">
                    <Button
                        onClick={() => onBook(astrologer)}
                        className="btn-primary text-sm py-2 px-6"
                    >
                        Book Now
                    </Button>
                </Link>
            </div>
        </div>
    );
});

AstrologerCard.displayName = 'AstrologerCard';

export default AstrologerCard;
