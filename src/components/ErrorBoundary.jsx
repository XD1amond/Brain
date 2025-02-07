import React from 'react';
import { cn } from '@/lib/utils';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-8 p-8 bg-card rounded-xl shadow-lg">
          <div className="text-center">
            <div className="text-6xl text-red-500 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We're sorry, but there was an error loading this component.
            </p>
            
            {this.state.error && (
              <pre className="mt-4 p-4 bg-muted rounded-lg overflow-x-auto text-sm text-muted-foreground">
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className={cn(
                "mt-6 px-6 py-2 rounded-lg font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}