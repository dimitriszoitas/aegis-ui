import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MarketingSite } from '@/marketing/marketing-site';
import { useTheme } from '@/lib/theme';
import { useLayoutTheme } from '@/lib/layout-theme';
import { useAutoHideScrollbars } from '@/lib/scrollbars';
import './styles/globals.css';
const SiemConsole = lazy(() =>
  import('@/patterns/siem-console').then((module) => ({ default: module.SiemConsole })),
);
const ComponentsPage = lazy(() =>
  import('@/marketing/components-page').then((module) => ({ default: module.ComponentsPage })),
);

function ConsoleApp() {
  useEffect(() => {
    document.title = 'Aegis — security operations';
  }, []);
  const { theme, setTheme } = useTheme();
  const { layoutTheme, setLayoutTheme } = useLayoutTheme();
  return (
    <SiemConsole
      theme={theme}
      onThemeChange={setTheme}
      layoutTheme={layoutTheme}
      onLayoutThemeChange={setLayoutTheme}
    />
  );
}
function App() {
  useAutoHideScrollbars();
  const view = new URLSearchParams(window.location.search).get('view');
  return view === 'console' || view === 'components' ? (
    <Suspense
      fallback={
        <div className="app-loading" role="status">
          {view === 'console' ? 'Opening the Aegis console…' : 'Opening the component library…'}
        </div>
      }
    >
      {view === 'console' ? <ConsoleApp /> : <ComponentsPage />}
    </Suspense>
  ) : (
    <MarketingSite />
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
