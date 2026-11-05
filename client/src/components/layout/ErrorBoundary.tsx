
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="bg-background-card max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-destructive/30">
                        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <h1 className="font-serif text-2xl font-bold text-primary mb-3">
                            Something went wrong
                        </h1>

                        <p className="text-muted-foreground mb-8">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={this.handleReload}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Page
                            </Button>

                            <div className="text-xs text-muted-foreground/60 font-mono bg-background-elevated p-4 rounded-lg overflow-auto max-h-32 text-left">
                                {this.state.error?.message}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

