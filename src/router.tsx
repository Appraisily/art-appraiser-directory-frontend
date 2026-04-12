import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { StandardizedLocationPage } from './pages/StandardizedLocationPage';
import { StandardizedAppraiserPage } from './pages/StandardizedAppraiserPage';
import { NotFoundPage } from './pages/NotFoundPage';
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
        element: <StandardizedLocationPage />
      },
      {
        path: 'appraiser/:appraiserId',
        element: <StandardizedAppraiserPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ],
  },
]);
