
import { Skeleton } from '@/components/ui/skeleton';

export function AstrologerCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-purple-900/5 h-[420px] flex flex-col">
            <div className="flex items-start gap-4 mb-6">
                <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/2" />
                    {/* rating placeholder removed */}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 p-3 rounded-xl space-y-1">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-5 w-10 mx-auto" />
                </div>
                <div className="bg-purple-50 p-3 rounded-xl space-y-1">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-5 w-10 mx-auto" />
                </div>
            </div>

            <div className="space-y-3 mb-6 flex-grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
        </div>
    );
}
