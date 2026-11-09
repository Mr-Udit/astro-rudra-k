import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Astrologer } from '@/types';
import { profileApi } from '@/api/profile';
import { toast } from 'sonner';

interface AstrologerCardProps {
    astrologer: Astrologer;
    onBook: (astrologer: Astrologer) => void;
}

const AstrologerCard = memo(({ astrologer, onBook }: AstrologerCardProps) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isToggling) return;
        setIsToggling(true);

        try {
            await profileApi.toggleFavorite(astrologer.id);
            setIsFavorite(!isFavorite);
            toast.success(!isFavorite ? 'Added to favorites' : 'Removed from favorites');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update favorites');
        } finally {
            setIsToggling(false);
        }
    };

    // Check if already in favorites (this would need to be passed as prop in a real implementation)
    // For now, we'll just handle the toggle optimistically

    return (
        <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-primary/20 border border-border card-hover relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
                <img
                    src={astrologer.image}
                    alt={astrologer.name}
                    className="w-20 h-20 rounded-full object-cover border-3 border-[hsl(var(--gold))]"
                    loading="lazy"
                />
                <div className="flex-1 pt-2">
                    <h3 className="font-serif text-xl font-bold text-primary">
                        {astrologer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{astrologer.title}</p>
                </div>
                <button
                    onClick={toggleFavorite}
                    disabled={isToggling}
                    className="p-2 rounded-lg bg-background-elevated hover:bg-background-card transition-colors text-muted-foreground hover:text-red-500"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart
                        className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                        strokeWidth={2}
                    />
                </button>
            </div>

            {/* About / skills fallback */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
                          className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-[hsl(var(--text-primary))]"
                      >
                          {spec}
                      </span>
                  ))}
              </div>
            )}

            {/* Languages */}
            {astrologer.languages.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Languages className="w-4 h-4" />
                <span>{astrologer.languages.join(', ')}</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-border mb-4">
                <div className="text-center">
                    <span className="block font-bold text-accent">
                        {astrologer.experience}+
                    </span>
                    <span className="text-xs text-muted-foreground">Years</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-accent">
                        {(astrologer.consultations / 1000).toFixed(0)}K+
                    </span>
                    <span className="text-xs text-muted-foreground">Consults</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-accent">
                        {astrologer.accuracy}%
                    </span>
                    <span className="text-xs text-muted-foreground">Accuracy</span>
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
