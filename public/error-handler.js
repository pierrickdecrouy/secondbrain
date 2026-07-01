// Global error handler — loaded as an external script so that the
// Content-Security-Policy does not need 'unsafe-inline' in script-src.
window.onerror = function (message, source, lineno, colno, error) {
  if (
    typeof message === 'string' &&
    (message.includes('Script error.') || message.includes('View Name for the webview'))
  ) {
    return true;
  }
  console.error('Global error:', message, { source, lineno, colno, error });
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  console.error('Unhandled Promise Rejection:', event.reason);
});
