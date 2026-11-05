
import { Skeleton } from '@/components/ui/skeleton';

export function AstrologerCardSkeleton() {
    return (
        <div className="bg-background-card rounded-2xl p-6 shadow-lg shadow-primary/20 border border-border h-[420px] flex flex-col">
            <div className="flex items-start gap-4 mb-6">
                <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-3/4 bg-muted" />
                        <Skeleton className="h-5 w-12 rounded-full bg-muted" />
                    </div>
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    {/* rating placeholder removed */}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted p-3 rounded-xl space-y-1">
                    <Skeleton className="h-3 w-16 mx-auto bg-muted" />
                    <Skeleton className="h-5 w-10 mx-auto bg-muted" />
                </div>
                <div className="bg-muted p-3 rounded-xl space-y-1">
                    <Skeleton className="h-3 w-16 mx-auto bg-muted" />
                    <Skeleton className="h-5 w-10 mx-auto bg-muted" />
                </div>
            </div>

            <div className="space-y-3 mb-6 flex-grow">
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-12 bg-muted" />
                    <Skeleton className="h-6 w-20 bg-muted" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl bg-muted" />
            </div>
        </div>
    );
}
