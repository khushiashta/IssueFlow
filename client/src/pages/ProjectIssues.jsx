import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'

const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const statusBadgeStyles = {
  open: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-50 text-blue-800',
  resolved: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
}

const priorityBadgeStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-800',
  high: 'bg-red-50 text-red-800',
}

function useIssueError() {
  const { logout } = useAuth()
  return useCallback((error) => {
    if (error.status === 401) {
      logout()
      return 'Your session has expired. Sign in again to continue.'
    }
    return error.message || 'Something went wrong. Please try again.'
  }, [logout])
}

function IssueError({ children, onRetry }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p>{children}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-2 font-medium underline underline-offset-2">Try again</button>}
    </div>
  )
}

function IssueFields({ values, onChange, disabled, prefix }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${prefix}-title`} className="mb-1.5 block text-sm font-medium text-slate-800">Title</label>
        <input
          id={`${prefix}-title`}
          name="title"
          type="text"
          value={values.title}
          onChange={onChange('title')}
          maxLength={160}
          required
          disabled={disabled}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <p className="mt-1 text-xs text-slate-500">{values.title.length}/160 characters</p>
      </div>
      <div>
        <label htmlFor={`${prefix}-description`} className="mb-1.5 block text-sm font-medium text-slate-800">Description <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea
          id={`${prefix}-description`}
          name="description"
          value={values.description}
          onChange={onChange('description')}
          maxLength={5000}
          rows={3}
          disabled={disabled}
          className="block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <p className="mt-1 text-xs text-slate-500">{values.description.length}/5000 characters</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${prefix}-priority`} className="mb-1.5 block text-sm font-medium text-slate-800">Priority</label>
          <select
            id={`${prefix}-priority`}
            name="priority"
            value={values.priority}
            onChange={onChange('priority')}
            disabled={disabled}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          >
            {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${prefix}-status`} className="mb-1.5 block text-sm font-medium text-slate-800">Status</label>
          <select
            id={`${prefix}-status`}
            name="status"
            value={values.status}
            onChange={onChange('status')}
            disabled={disabled}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          >
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

function displayDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function Badge({ children, className }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>
}

function newIssueValues() {
  return { title: '', description: '', priority: 'medium', status: 'open' }
}

export default function ProjectIssues({ projectId }) {
  const getErrorMessage = useIssueError()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [createValues, setCreateValues] = useState(newIssueValues)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingIssueId, setEditingIssueId] = useState(null)
  const [editValues, setEditValues] = useState(newIssueValues)
  const [editError, setEditError] = useState('')
  const [loadingIssueId, setLoadingIssueId] = useState(null)
  const [savingIssueId, setSavingIssueId] = useState(null)
  const [deletingIssueId, setDeletingIssueId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    apiRequest(`/api/projects/${encodeURIComponent(projectId)}/issues`)
      .then((data) => {
        if (!Array.isArray(data.issues)) throw new Error('The server returned an invalid issues response.')
        if (active) setIssues(data.issues)
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [projectId, retryCount, getErrorMessage])

  function updateValues(setValues) {
    return (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  function validate(values) {
    if (!values.title.trim()) return 'Enter an issue title.'
    if (values.title.trim().length > 160) return 'Issue title must be at most 160 characters.'
    if (values.description.trim().length > 5000) return 'Description must be at most 5,000 characters.'
    if (!statuses.some((status) => status.value === values.status)) return 'Choose a valid status.'
    if (!priorities.some((priority) => priority.value === values.priority)) return 'Choose a valid priority.'
    return ''
  }

  async function createIssue(event) {
    event.preventDefault()
    setCreateError('')
    const validationError = validate(createValues)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    setCreating(true)
    try {
      const data = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: createValues.title.trim(),
          description: createValues.description.trim(),
          priority: createValues.priority,
          status: createValues.status,
        }),
      })
      if (!data.issue) throw new Error('The server did not return the created issue.')
      setIssues((current) => [data.issue, ...current])
      setCreateValues(newIssueValues())
      setCreateOpen(false)
    } catch (error) {
      setCreateError(getErrorMessage(error))
    } finally {
      setCreating(false)
    }
  }

  async function beginEdit(issueId) {
    setLoadingIssueId(issueId)
    setEditError('')
    setActionError('')
    try {
      const data = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`)
      if (!data.issue) throw new Error('The server did not return the requested issue.')
      setEditValues({
        title: data.issue.title || '',
        description: data.issue.description || '',
        priority: data.issue.priority || 'medium',
        status: data.issue.status || 'open',
      })
      setEditingIssueId(issueId)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setLoadingIssueId(null)
    }
  }

  async function saveIssue(event, issueId) {
    event.preventDefault()
    setEditError('')
    const validationError = validate(editValues)
    if (validationError) {
      setEditError(validationError)
      return
    }

    setSavingIssueId(issueId)
    try {
      const data = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editValues.title.trim(),
          description: editValues.description.trim(),
          priority: editValues.priority,
          status: editValues.status,
        }),
      })
      if (!data.issue) throw new Error('The server did not return the updated issue.')
      setIssues((current) => current.map((issue) => issue._id === issueId ? data.issue : issue))
      setEditingIssueId(null)
    } catch (error) {
      setEditError(getErrorMessage(error))
    } finally {
      setSavingIssueId(null)
    }
  }

  async function deleteIssue(issue) {
    const confirmed = window.confirm(`Delete “${issue.title}”? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingIssueId(issue._id)
    setActionError('')
    try {
      await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issue._id)}`, { method: 'DELETE' })
      setIssues((current) => current.filter((currentIssue) => currentIssue._id !== issue._id))
      if (editingIssueId === issue._id) setEditingIssueId(null)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setDeletingIssueId(null)
    }
  }

  function retry() {
    setRetryCount((current) => current + 1)
  }

  return (
    <section className="mt-9 border-t border-slate-200 pt-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Issues</h2>
          {!loading && !loadError && <p className="mt-1 text-sm text-slate-600">{issues.length} {issues.length === 1 ? 'issue' : 'issues'} in this project</p>}
        </div>
        {!createOpen && (
          <button type="button" onClick={() => { setCreateOpen(true); setCreateError('') }} disabled={editingIssueId !== null || loadingIssueId !== null} className="rounded-md bg-blue-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            Create issue
          </button>
        )}
      </div>

      {createOpen && (
        <form onSubmit={createIssue} className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">New issue</h3>
              <p className="mt-1 text-sm text-slate-600">Describe the work to track in this project.</p>
            </div>
            <button type="button" onClick={() => { setCreateOpen(false); setCreateError('') }} disabled={creating} className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">Cancel</button>
          </div>
          {createError && <div className="mb-4"><IssueError>{createError}</IssueError></div>}
          <IssueFields values={createValues} onChange={updateValues(setCreateValues)} disabled={creating} prefix="new-issue" />
          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={creating} className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {creating ? 'Creating…' : 'Create issue'}
            </button>
          </div>
        </form>
      )}

      {actionError && <div className="mb-4"><IssueError>{actionError}</IssueError></div>}
      {loading ? (
        <p className="py-6 text-sm text-slate-500" role="status">Loading issues…</p>
      ) : loadError ? (
        <IssueError onRetry={retry}>{loadError}</IssueError>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center sm:px-8">
          <h3 className="text-sm font-semibold text-slate-900">No issues yet</h3>
          <p className="mt-1 text-sm text-slate-600">Create an issue to start tracking work in this project.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li key={issue._id} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              {editingIssueId === issue._id ? (
                <form onSubmit={(event) => saveIssue(event, issue._id)}>
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">Edit issue</h3>
                    <p className="mt-1 text-sm text-slate-600">Update the title, description, status, or priority.</p>
                  </div>
                  {editError && <div className="mb-4"><IssueError>{editError}</IssueError></div>}
                  <IssueFields values={editValues} onChange={updateValues(setEditValues)} disabled={savingIssueId === issue._id} prefix={`edit-${issue._id}`} />
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => { setEditingIssueId(null); setEditError('') }} disabled={savingIssueId === issue._id} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60">Cancel</button>
                    <button type="submit" disabled={savingIssueId === issue._id} className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{savingIssueId === issue._id ? 'Saving…' : 'Save changes'}</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold text-slate-900">{issue.title}</h3>
                      {issue.description ? (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{issue.description}</p>
                      ) : (
                        <p className="mt-2 text-sm italic text-slate-500">No description</p>
                      )}
                      <p className="mt-3 text-xs text-slate-500">Created {displayDate(issue.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge className={statusBadgeStyles[issue.status] || statusBadgeStyles.open}>
                        {statuses.find((status) => status.value === issue.status)?.label || issue.status}
                      </Badge>
                      <Badge className={priorityBadgeStyles[issue.priority] || priorityBadgeStyles.medium}>
                        {priorities.find((priority) => priority.value === issue.priority)?.label || issue.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => beginEdit(issue._id)} disabled={loadingIssueId !== null || deletingIssueId !== null || editingIssueId !== null || createOpen || creating} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50">
                      {loadingIssueId === issue._id ? 'Loading…' : 'Edit'}
                    </button>
                    <button type="button" onClick={() => deleteIssue(issue)} disabled={loadingIssueId !== null || deletingIssueId !== null || editingIssueId !== null || createOpen || creating} className="rounded-md px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50">
                      {deletingIssueId === issue._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
