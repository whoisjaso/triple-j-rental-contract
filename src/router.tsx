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
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
])
