import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiemConsole } from '@/patterns/siem-console';
import { useTheme } from '@/lib/theme';
import './styles/globals.css';
function App() {
  const { theme, setTheme } = useTheme();
  return <SiemConsole theme={theme} onThemeChange={setTheme} />;
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
