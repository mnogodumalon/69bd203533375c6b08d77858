import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import EinkaufsgruppePage from '@/pages/EinkaufsgruppePage';
import TeilnehmerPage from '@/pages/TeilnehmerPage';
import EinkaufslistePage from '@/pages/EinkaufslistePage';
import ArtikelPage from '@/pages/ArtikelPage';
import PublicFormEinkaufsgruppe from '@/pages/public/PublicForm_Einkaufsgruppe';
import PublicFormTeilnehmer from '@/pages/public/PublicForm_Teilnehmer';
import PublicFormEinkaufsliste from '@/pages/public/PublicForm_Einkaufsliste';
import PublicFormArtikel from '@/pages/public/PublicForm_Artikel';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route path="public/69bd201272c1eb2d5e90e025" element={<PublicFormEinkaufsgruppe />} />
            <Route path="public/69bd201635dec1f676ca482e" element={<PublicFormTeilnehmer />} />
            <Route path="public/69bd20171f363e8e32d0e8af" element={<PublicFormEinkaufsliste />} />
            <Route path="public/69bd2017bdc3f95e8029956d" element={<PublicFormArtikel />} />
            <Route element={<Layout />}>
              <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
              <Route path="einkaufsgruppe" element={<EinkaufsgruppePage />} />
              <Route path="teilnehmer" element={<TeilnehmerPage />} />
              <Route path="einkaufsliste" element={<EinkaufslistePage />} />
              <Route path="artikel" element={<ArtikelPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
