import { createBrowserRouter, Navigate } from 'react-router'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import AgreementList from './pages/AgreementList'
import AgreementCreate from './pages/AgreementCreate'
import AgreementEdit from './pages/AgreementEdit'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AgreementList /> },
      { path: 'agreements/new', element: <AgreementCreate /> },
      { path: 'agreements/:id', element: <AgreementEdit /> },
    ],
  },
  // Public client signing routes — NOT nested under /admin layout
  // Real components are created in Plans 03 and 04; placeholders register the routes now.
  {
    path: '/sign/expired',
    element: <div>Sign page expired placeholder</div>,
  },
  {
    path: '/sign/:token',
    element: <div>Sign page placeholder</div>,
  },
  {
    path: '/sign/:token/complete',
    element: <div>Sign page complete placeholder</div>,
  },
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
])
