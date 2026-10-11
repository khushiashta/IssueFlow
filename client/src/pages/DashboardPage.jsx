import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'

const statusLabels = {
  open: 'Open',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusStyles = {
  open: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-50 text-blue-800',
  resolved: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
}

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-800',
  high: 'bg-red-50 text-red-800',
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function displayLabel(value) {
  return value?.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Unknown'
}

function SummaryCard({ label, value, detail, unavailable = false }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${unavailable ? 'text-slate-400' : 'text-slate-950'}`}>
        {value}
      </p>
      <p className="mt-1 min-h-5 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function DashboardError({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800" role="alert">
      <p className="font-medium">Dashboard data could not be loaded</p>
      <p className="mt-1">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-md px-2 py-1 font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2">
        Try again
      </button>
    </div>
  )
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const loadDashboard = useCallback(async (active) => {
    setLoading(true)
    setError('')
    setDashboardData(null)

    try {
      const projectResponse = await apiRequest('/api/projects')
      if (!Array.isArray(projectResponse.projects)) {
        throw new Error('The server returned an invalid projects response.')
      }
      const projects = projectResponse.projects

      if (projects.length === 0) {
        if (active()) setDashboardData({ projects, issues: [], issueStats: { total: 0, open: 0, resolved: 0 }, issueFailures: 0 })
        return
      }

      const results = await Promise.allSettled(projects.map(async (project) => {
        const response = await apiRequest(`/api/projects/${encodeURIComponent(project._id)}/issues`)
        if (!Array.isArray(response.issues)) throw new Error('The server returned an invalid issues response.')
        return response.issues.map((issue) => ({
          ...issue,
          projectId: project._id,
          projectName: project.name,
        }))
      }))

      if (results.some((result) => result.status === 'rejected' && result.reason?.status === 401)) {
        logout()
        return
      }

      const failedRequests = results.filter((result) => result.status === 'rejected').length
      const issues = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      const issueStats = failedRequests === 0
        ? {
            total: issues.length,
            open: issues.filter((issue) => issue.status === 'open').length,
            resolved: issues.filter((issue) => issue.status === 'resolved').length,
          }
        : null

      issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (active()) setDashboardData({ projects, issues, issueStats, issueFailures: failedRequests })
    } catch (requestError) {
      if (requestError.status === 401) logout()
      if (active()) setError(requestError.message || 'Something went wrong. Please try again.')
    } finally {
      if (active()) setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    let active = true
    loadDashboard(() => active)
    return () => { active = false }
  }, [loadDashboard, retryCount])

  const projects = dashboardData?.projects || []
  const issueStats = dashboardData?.issueStats
  const recentIssues = issueStats ? dashboardData.issues.slice(0, 5) : []

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">Workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here’s an overview of your IssueFlow workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/projects" className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
            Create project
          </Link>
          <Link to="/projects" className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
            Browse projects
          </Link>
        </div>
      </div>

      {error ? (
        <DashboardError message={error} onRetry={() => setRetryCount((current) => current + 1)} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy={loading} aria-label="Workspace summary">
            <SummaryCard label="Projects" value={loading ? '—' : projects.length} detail={loading ? 'Loading…' : 'Accessible projects'} unavailable={loading} />
            <SummaryCard label="Total issues" value={loading || !issueStats ? '—' : issueStats.total} detail={loading ? 'Loading…' : issueStats ? 'Across all projects' : 'Some project counts unavailable'} unavailable={loading || !issueStats} />
            <SummaryCard label="Open issues" value={loading || !issueStats ? '—' : issueStats.open} detail={loading ? 'Loading…' : issueStats ? 'Across all projects' : 'Some project counts unavailable'} unavailable={loading || !issueStats} />
            <SummaryCard label="Resolved issues" value={loading || !issueStats ? '—' : issueStats.resolved} detail={loading ? 'Loading…' : issueStats ? 'Across all projects' : 'Some project counts unavailable'} unavailable={loading || !issueStats} />
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-slate-500" role="status" aria-live="polite">Loading projects and issue totals…</p>
          ) : (
            <>
              {dashboardData?.issueFailures > 0 && (
                <div className="mt-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between" role="status">
                  <p>Issue totals are unavailable because issue data could not be loaded for {dashboardData.issueFailures} {dashboardData.issueFailures === 1 ? 'project' : 'projects'}.</p>
                  <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="shrink-0 self-start font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-amber-700 sm:self-auto">
                    Retry totals
                  </button>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 sm:px-8 sm:py-10">
                  <h2 className="text-base font-semibold text-slate-900">Start with a project</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Projects give your work a shared home. Create your first one, then add issues from its detail page.
                  </p>
                  <Link to="/projects" className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
                    Create your first project
                  </Link>
                </div>
              ) : (
                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  <section aria-labelledby="dashboard-projects-heading">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 id="dashboard-projects-heading" className="text-base font-semibold text-slate-900">Your projects</h2>
                        <p className="mt-1 text-sm text-slate-600">Recently created projects in your workspace.</p>
                      </div>
                      <Link to="/projects" className="text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:underline">View all</Link>
                    </div>
                    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                      {projects.slice(0, 5).map((project) => (
                        <li key={project._id}>
                          <Link to={`/projects/${project._id}`} className="block min-w-0 px-4 py-4 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:px-5">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="break-words text-sm font-semibold text-slate-900">{project.name}</h3>
                                <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-600">{project.description || 'No description'}</p>
                              </div>
                              <span className="shrink-0 text-xs text-slate-500">{formatDate(project.createdAt)}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section aria-labelledby="dashboard-issues-heading">
                    <div className="mb-4">
                      <h2 id="dashboard-issues-heading" className="text-base font-semibold text-slate-900">Recent issues</h2>
                      <p className="mt-1 text-sm text-slate-600">Latest issues from your projects.</p>
                    </div>
                    {!issueStats ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-sm leading-6 text-slate-600">
                        Recent issues are hidden until all project issue lists are available, so the overview stays accurate.
                      </div>
                    ) : recentIssues.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-5">
                        <h3 className="text-sm font-semibold text-slate-900">No issues yet</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">Open a project to create and track its first issue.</p>
                        <Link to={`/projects/${projects[0]._id}`} className="mt-3 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:underline">
                          Open {projects[0].name}
                        </Link>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                        {recentIssues.map((issue) => (
                          <li key={issue._id}>
                            <Link to={`/projects/${issue.projectId}`} aria-label={`${issue.title}, ${statusLabels[issue.status] || displayLabel(issue.status)}, ${issue.projectName}`} className="block min-w-0 px-4 py-4 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:px-5">
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="break-words text-sm font-semibold text-slate-900">{issue.title}</h3>
                                  <p className="mt-1 truncate text-xs text-slate-500">{issue.projectName} · {formatDate(issue.createdAt)}</p>
                                </div>
                                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[issue.status] || statusStyles.open}`}>
                                    {statusLabels[issue.status] || displayLabel(issue.status)}
                                  </span>
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityStyles[issue.priority] || priorityStyles.medium}`}>
                                    {displayLabel(issue.priority)} priority
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

export default DashboardPage
