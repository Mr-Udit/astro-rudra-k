import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Astrologer } from '@/types';
import { useAstrologers } from '@/hooks/useAstrologers';
import { AstrologerCardSkeleton } from '@/components/ui-custom/AstrologerCardSkeleton';
import AstrologerCard from '@/components/ui-custom/AstrologerCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AstrologersPage() {
  useDocumentTitle('Our Astrologers');
  const { astrologers, specializations, isLoading, isError } = useAstrologers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Zustand store
  const setSelectedAstrologer = useBookingStore(state => state.setSelectedAstrologer);
  const setBookingStep = useBookingStore(state => state.setBookingStep);

  const filteredAstrologers = useMemo(() => {
    return astrologers.filter((astrologer: Astrologer) => {
      const matchesSearch =
        astrologer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        astrologer.specializations.some((s: string) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesFilter =
        selectedFilter === 'All' || astrologer.specializations.includes(selectedFilter);

      return matchesSearch && matchesFilter;
    });
  }, [astrologers, searchQuery, selectedFilter]);

  const handleBookNow = useCallback((astrologer: Astrologer) => {
    setSelectedAstrologer(astrologer);
    setBookingStep('consultation');
    toast.success(`Selected ${astrologer.name}`);
  }, [setSelectedAstrologer, setBookingStep]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] pt-20 sm:pt-24 pb-10 sm:pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#2D1B69] to-[#4A1E8C] py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A574]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4A574]/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Find Your Guide
            </h1>
            <p className="text-white/80 text-sm sm:text-lg mb-6 sm:mb-8">
              Connect with expert Vedic astrologers for personalized guidance
            </p>
            <div className="relative max-w-xl mx-auto px-4 sm:px-0">
              <Search className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B80]" />
              <Input
                type="text"
                placeholder="Search by name, specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 rounded-full border-0 shadow-xl text-sm sm:text-base w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-[#1A1A2E] font-medium">
            <Filter className="w-5 h-5" />
            <span className="text-sm sm:text-base">Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedFilter(spec)}
                className={`filter-chip text-xs sm:text-sm ${selectedFilter === spec ? 'active' : ''}`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-[#6B6B80] mb-6">
          Showing {filteredAstrologers.length} astrologer
          {filteredAstrologers.length !== 1 ? 's' : ''}
        </p>

        {/* Astrologers Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <AstrologerCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2D1B69] mb-2">
              Failed to load astrologers
            </h3>
            <p className="text-[#6B6B80] mb-6">
              Something went wrong while fetching data. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAstrologers.map((astrologer: Astrologer) => (
              <AstrologerCard
                key={astrologer.id}
                astrologer={astrologer}
                onBook={handleBookNow}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredAstrologers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#F5F2EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[#6B6B80]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2D1B69] mb-2">
              No astrologers found
            </h3>
            <p className="text-[#6B6B80]">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
