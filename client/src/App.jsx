import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import DashboardPage from './pages/DashboardPage'
import { ProjectDetailPage, ProjectsPage } from './pages/ProjectsPages'

function NotFound() {
  return (
    <section className="mx-auto max-w-2xl py-12 text-center">
      <p className="text-sm font-semibold text-blue-700">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">The page you’re looking for doesn’t exist or may have moved.</p>
      <Link to="/" className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
        Back to dashboard
      </Link>
    </section>
  )
}

function AuthGate({ guestsOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600" role="status">Loading IssueFlow…</div>
  }
  if (guestsOnly && user) return <Navigate to="/" replace />
  if (!guestsOnly && !user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

function Shell() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white text-slate-900 md:flex">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-slate-50 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <Link to="/" className="flex items-center gap-3 px-5 py-4" aria-label="IssueFlow home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 text-xs font-bold tracking-wide text-white">IF</span>
          <span className="text-sm font-semibold tracking-tight text-slate-950">IssueFlow</span>
        </Link>
        <nav aria-label="Main navigation" className="flex gap-1 px-3 pb-3 md:flex-col md:px-3 md:pt-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 8.5 7-5 7 5v7.25A1.25 1.25 0 0 1 15.75 17h-11A1.25 1.25 0 0 1 3.5 15.75V8.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 17v-5.5h5V17" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5h12M4 10h12M4 14.5h12" />
              <circle cx="2.5" cy="5.5" r=".5" fill="currentColor" stroke="none" />
              <circle cx="2.5" cy="10" r=".5" fill="currentColor" stroke="none" />
              <circle cx="2.5" cy="14.5" r=".5" fill="currentColor" stroke="none" />
            </svg>
            Projects
          </NavLink>
        </nav>
        <div className="mt-auto hidden border-t border-slate-200 px-5 py-4 md:block">
          <p className="truncate text-xs font-medium text-slate-700">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p>
          <button type="button" onClick={logout} className="mt-3 text-xs font-medium text-slate-600 hover:text-slate-950 focus:outline-none focus:underline">
            Sign out
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 md:hidden">
          <span className="truncate text-xs text-slate-600">{user?.name}</span>
          <button type="button" onClick={logout} className="ml-3 shrink-0 text-xs font-medium text-blue-700 hover:text-blue-800">Sign out</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 px-5 sm:px-8">
          <p className="text-sm text-slate-500">Workspace</p>
          <span className="text-xs font-medium text-slate-500">IssueFlow</span>
        </header>
        <main className="px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthGate guestsOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<AuthGate />}>
        <Route path="/" element={<Shell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
