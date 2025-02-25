import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { LocationPage } from './pages/LocationPage';
import { AppraiserPage } from './pages/AppraiserPage';
import { RootLayout } from './layouts/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <App />
      },
      {
        path: 'location/:citySlug',
        element: <LocationPage />
      },
      {
        path: 'appraiser/:appraiserId',
        element: <AppraiserPage />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ],
  },
]);