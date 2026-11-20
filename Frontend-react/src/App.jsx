import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuthContext.jsx'
import HeaderBar from './components/HeaderBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import CallbackPage from './pages/CallbackPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DivisionesPage from './pages/DivisionesPage.jsx'
import ProgramasPage from './pages/ProgramasPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function RootRedirect() {
  const { token } = useAuth()
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}

function AppShell() {
  const { token, logout } = useAuth()

  return (
    <>
      <HeaderBar token={token} onLogout={logout} />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/divisiones"
          element={
            <ProtectedRoute token={token}>
              <DivisionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programas"
          element={
            <ProtectedRoute token={token}>
              <ProgramasPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
