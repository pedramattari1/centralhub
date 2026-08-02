import { Component } from 'react';
import { Button } from './ui/button.jsx';

// Top-level error boundary so a render error shows a recovery UI, not a blank page.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="max-w-sm text-sm text-gray-500">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
