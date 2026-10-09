import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ToastProvider } from './components/ToastProvider';
import { AthletesPage } from './pages/AthletesPage';
import { NotFoundPage } from './pages/NotFoundPage';

// The detail page pulls in the charting library, so load it on demand.
const AthleteDetailPage = lazy(() =>
  import('./pages/AthleteDetailPage').then((m) => ({ default: m.AthleteDetailPage })),
);

function PageFallback() {
  return (
    <div className="flex justify-center py-24" role="status">
      <Loader2 className="size-6 animate-spin text-muted" aria-hidden />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<AthletesPage />} />
            <Route
              path="athletes/:id"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AthleteDetailPage />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
