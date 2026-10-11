import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'

function useProjectError() {
  const { logout } = useAuth()
  return useCallback((error) => {
    if (error.status === 401) {
      logout()
      return 'Your session has expired. Sign in again to continue.'
    }
    return error.message || 'Something went wrong. Please try again.'
  }, [logout])
}

function ErrorMessage({ children, onRetry }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <p>{children}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-2 font-medium underline underline-offset-2">Try again</button>}
    </div>
  )
}

function ProjectFields({ name, description, onNameChange, onDescriptionChange, disabled = false }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-slate-800">Project name</label>
        <input
          id="project-name"
          name="name"
          type="text"
          value={name}
          onChange={onNameChange}
          maxLength={120}
          required
          disabled={disabled}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <p className="mt-1 text-xs text-slate-500">{name.length}/120 characters</p>
      </div>
      <div>
        <label htmlFor="project-description" className="mb-1.5 block text-sm font-medium text-slate-800">Description <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea
          id="project-description"
          name="description"
          value={description}
          onChange={onDescriptionChange}
          maxLength={2000}
          rows={4}
          disabled={disabled}
          className="block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <p className="mt-1 text-xs text-slate-500">{description.length}/2000 characters</p>
      </div>
    </div>
  )
}

function formatDate(date) {
  if (!date) return null
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsedDate)
}

export function ProjectsPage() {
  const getErrorMessage = useProjectError()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    apiRequest('/api/projects')
      .then((data) => {
        if (!Array.isArray(data.projects)) throw new Error('The server returned an invalid projects response.')
        if (active) setProjects(data.projects)
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [retryCount, getErrorMessage])

  async function createProject(event) {
    event.preventDefault()
    setFormError('')
    if (!name.trim()) {
      setFormError('Enter a project name.')
      return
    }
    if (name.trim().length > 120 || description.trim().length > 2000) {
      setFormError('Project name must be at most 120 characters and description at most 2,000 characters.')
      return
    }

    setCreating(true)
    try {
      const data = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!data.project) throw new Error('The server did not return the created project.')
      setProjects((current) => [data.project, ...current])
      setName('')
      setDescription('')
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setCreating(false)
    }
  }

  function retryLoad() {
    setRetryCount((current) => current + 1)
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-slate-500">Workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Projects</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create and manage the projects you use to organize work.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your projects</h2>
            {!loading && !loadError && <span className="text-sm text-slate-500">{projects.length}</span>}
          </div>
          {loading ? (
            <p className="py-8 text-sm text-slate-500" role="status">Loading projects…</p>
          ) : loadError ? (
            <ErrorMessage onRetry={retryLoad}>{loadError}</ErrorMessage>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center sm:px-8">
              <h3 className="text-sm font-semibold text-slate-900">No projects yet</h3>
              <p className="mt-1 text-sm text-slate-600">Create a project to give your work a home.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {projects.map((project) => (
                <li key={project._id}>
                  <Link to={`/projects/${project._id}`} className="block px-4 py-4 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none sm:px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{project.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{project.description || 'No description'}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(project.createdAt) || ''}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Create a project</h2>
          <p className="mt-1 text-sm text-slate-600">Give your work a clear name and optional description.</p>
          <form className="mt-5" onSubmit={createProject}>
            {formError && <div className="mb-4"><ErrorMessage>{formError}</ErrorMessage></div>}
            <ProjectFields
              name={name}
              description={description}
              onNameChange={(event) => setName(event.target.value)}
              onDescriptionChange={(event) => setDescription(event.target.value)}
              disabled={creating}
            />
            <button type="submit" disabled={creating} className="mt-5 w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const getErrorMessage = useProjectError()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    setProject(null)
    apiRequest(`/api/projects/${encodeURIComponent(projectId)}`)
      .then((data) => {
        if (!data.project) throw new Error('The server did not return the requested project.')
        if (active) setProject(data.project)
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [projectId, retryCount, getErrorMessage])

  function beginEditing() {
    setName(project.name || '')
    setDescription(project.description || '')
    setFormError('')
    setEditing(true)
  }

  async function saveProject(event) {
    event.preventDefault()
    setFormError('')
    if (!name.trim()) {
      setFormError('Enter a project name.')
      return
    }
    if (name.trim().length > 120 || description.trim().length > 2000) {
      setFormError('Project name must be at most 120 characters and description at most 2,000 characters.')
      return
    }

    setSaving(true)
    try {
      const data = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!data.project) throw new Error('The server did not return the updated project.')
      setProject(data.project)
      setEditing(false)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function deleteProject() {
    const confirmed = window.confirm('Delete this project? The backend does not cascade deletion to associated issues, so those issues may remain. This action cannot be undone.')
    if (!confirmed) return

    setDeleting(true)
    setFormError('')
    try {
      await apiRequest(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })
      navigate('/projects', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="mx-auto max-w-5xl py-8 text-sm text-slate-500" role="status">Loading project…</p>
  if (loadError) {
    return (
      <section className="mx-auto max-w-5xl">
        <Link to="/projects" className="text-sm font-medium text-blue-700 hover:text-blue-800">← Projects</Link>
        <div className="mt-6"><ErrorMessage onRetry={() => setRetryCount((count) => count + 1)}>{loadError}</ErrorMessage></div>
      </section>
    )
  }
  if (!project) return null

  return (
    <section className="mx-auto max-w-5xl">
      <Link to="/projects" className="text-sm font-medium text-blue-700 hover:text-blue-800">← Projects</Link>
      <div className="mt-5 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-slate-500">Project</p>
          {!editing && <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-950">{project.name}</h1>}
          {!editing && project.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.description}</p>}
          {!editing && <p className="mt-3 text-xs text-slate-500">Created {formatDate(project.createdAt) || 'date unavailable'}</p>}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={beginEditing} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">Edit</button>
            <button type="button" onClick={deleteProject} disabled={deleting} className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={saveProject} className="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">Edit project</h2>
            <p className="mt-1 text-sm text-slate-600">Update the project name or description.</p>
          </div>
          {formError && <div className="mb-4"><ErrorMessage>{formError}</ErrorMessage></div>}
          <ProjectFields
            name={name}
            description={description}
            onNameChange={(event) => setName(event.target.value)}
            onDescriptionChange={(event) => setDescription(event.target.value)}
            disabled={saving}
          />
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      )}
      {!editing && formError && <div className="mt-6 max-w-2xl"><ErrorMessage>{formError}</ErrorMessage></div>}
      {!editing && !project.description && (
        <p className="mt-6 text-sm text-slate-600">This project does not have a description.</p>
      )}
    </section>
  )
}
