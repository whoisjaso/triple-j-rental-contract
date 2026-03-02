import { createBrowserRouter, Navigate } from 'react-router'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import AgreementList from './pages/AgreementList'
import AgreementCreate from './pages/AgreementCreate'
import AgreementEdit from './pages/AgreementEdit'
import ExpiredPage from './pages/ExpiredPage'
import ClientSign from './pages/ClientSign'

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
  // /sign/expired registered BEFORE /sign/:token to prevent 'expired' matching as a token (D-0201-3)
  {
    path: '/sign/expired',
    element: <ExpiredPage />,
  },
  {
    path: '/sign/:token',
    element: <ClientSign />,
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
