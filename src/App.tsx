import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useThemeSync } from './hooks/useThemeSync';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { AtlasPage } from './pages/AtlasPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocumentHistoryPage } from './pages/DocumentHistoryPage';
import { DiscordCallbackPage } from './pages/DiscordCallbackPage';
import { MdtPage } from './pages/MdtPage';
import { MdtPersonPage } from './pages/MdtPersonPage';
import { MdtVehiclePage } from './pages/MdtVehiclePage';

function App() {
  useThemeSync();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<Onboarding />} />
        <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
        <Route path="/panel" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="atlasy/:id" element={<AtlasPage />} />
          <Route path="generatory/:id" element={<GeneratorPage />} />
          <Route path="kalkulatory/:id" element={<CalculatorPage />} />
          <Route path="ustawienia" element={<SettingsPage />} />
          <Route path="dokumenty" element={<DocumentHistoryPage />} />
          <Route path="kartoteka" element={<MdtPage />} />
          <Route path="kartoteka/osoba/:id" element={<MdtPersonPage />} />
          <Route path="kartoteka/pojazd/:id" element={<MdtVehiclePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
