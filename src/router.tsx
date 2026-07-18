import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { StandardizedLocationPage } from './pages/StandardizedLocationPage';
import { StandardizedAppraiserPage } from './pages/StandardizedAppraiserPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RootLayout } from './layouts/RootLayout';
import { LocationHubPage } from './pages/LocationHubPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { GetListedPage } from './pages/GetListedPage';

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
        path: 'location',
        element: <LocationHubPage />
      },
      {
        path: 'location/:citySlug',
        element: <StandardizedLocationPage />
      },
      {
        path: 'appraiser/:appraiserId',
        element: <StandardizedAppraiserPage />
      },
      {
        path: 'methodology',
        element: <MethodologyPage />
      },
      {
        path: 'get-listed',
        element: <GetListedPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ],
  },
]);
