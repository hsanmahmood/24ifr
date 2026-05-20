import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-primary mb-6 animate-pulse">warning</span>
                    <h1 className="text-2xl font-bold text-white mb-4">Something went wrong.</h1>
                    <p className="text-zinc-400 mb-8 max-w-md">The application encountered an unexpected error. Please try refreshing the page.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary text-black font-bold py-3 px-8 rounded-md hover:brightness-110 transition-all"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
