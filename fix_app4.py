import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Let's completely replace function App()
new_app = """
function App() {
  const [indexingProgress, setIndexingProgress] = useState<number | null>(null);

  useEffect(() => {
    import('./semanticSearch').then(({ setIndexingProgressCallback }) => {
      setIndexingProgressCallback(setIndexingProgress);
    });
  }, []);

  let progressIndicator = null;
  if (indexingProgress !== null) {
    progressIndicator = (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--color-surface)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--color-border)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
            Indexation sémantique : {indexingProgress}%
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
      {progressIndicator}
    </ThemeProvider>
  );
}
"""

content = re.sub(r'function App\(\) \{.*?(?=export default App;)', new_app + '\n', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
