import { createBrowserRouter, Navigate } from 'react-router'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'

function AgreementList() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-forest-green">Agreements</h2>
      <p className="mt-4 text-gray-500">No agreements yet. Create your first one.</p>
    </div>
  )
}

function AgreementCreate() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-forest-green">New Agreement</h2>
      <p className="mt-4 text-gray-500">Create agreement form coming soon.</p>
    </div>
  )
}

function AgreementEdit() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-forest-green">Edit Agreement</h2>
      <p className="mt-4 text-gray-500">Edit agreement form coming soon.</p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AgreementList />,
      },
      {
        path: 'agreements/new',
        element: <AgreementCreate />,
      },
      {
        path: 'agreements/:id',
        element: <AgreementEdit />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
])
