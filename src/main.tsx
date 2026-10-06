import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiemConsole } from '@/patterns/siem-console';
import { useTheme } from '@/lib/theme';
import { useLayoutTheme } from '@/lib/layout-theme';
import './styles/globals.css';
function App() {
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
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
