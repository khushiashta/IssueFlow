import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AuthFrame({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-7 flex w-fit items-center gap-3" aria-label="IssueFlow">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-xs font-bold tracking-wide text-white">IF</span>
          <span className="text-base font-semibold tracking-tight text-slate-950">IssueFlow</span>
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          {children}
        </section>
        <p className="mt-5 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  )
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {children}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function PasswordField({ id = 'password', value, onChange, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false)
  return (
    <Field id={id} label="Password" type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete}>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 rounded-r-md px-3 text-xs font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </Field>
  )
}

function useAuthForm(actionName) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isRegister = actionName === 'register'

  function change(key) {
    return (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setFieldError('')

    if (isRegister && !values.name.trim()) {
      setFieldError('Enter your name.')
      return
    }
    if (!values.email.trim()) {
      setFieldError('Enter your email address.')
      return
    }
    if (!emailPattern.test(values.email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    if (!values.password) {
      setFieldError('Enter your password.')
      return
    }
    if (isRegister && values.password.length < 8) {
      setFieldError('Use at least 8 characters for your password.')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
      } else {
        await login({ email: values.email.trim(), password: values.password })
      }
      const destination = location.state?.from
      const target = destination ? `${destination.pathname}${destination.search || ''}${destination.hash || ''}` : '/'
      navigate(target, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return { values, change, error, fieldError, submitting, submit }
}

export function LoginPage() {
  const form = useAuthForm('login')
  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue to your IssueFlow workspace."
      footer={<>New to IssueFlow? <Link to="/register" className="font-medium text-blue-700 hover:text-blue-800">Create an account</Link></>}
    >
      <form className="mt-6 space-y-4" onSubmit={form.submit} noValidate>
        {form.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{form.error}</p>}
        {form.fieldError && <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{form.fieldError}</p>}
        <Field id="email" label="Email" type="email" value={form.values.email} onChange={form.change('email')} autoComplete="email" />
        <PasswordField value={form.values.password} onChange={form.change('password')} />
        <button type="submit" disabled={form.submitting} className="flex w-full justify-center rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
          {form.submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const form = useAuthForm('register')
  return (
    <AuthFrame
      title="Create your account"
      subtitle="Set up an account to start using IssueFlow."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-blue-700 hover:text-blue-800">Sign in</Link></>}
    >
      <form className="mt-6 space-y-4" onSubmit={form.submit} noValidate>
        {form.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{form.error}</p>}
        {form.fieldError && <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{form.fieldError}</p>}
        <Field id="name" label="Name" value={form.values.name} onChange={form.change('name')} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={form.values.email} onChange={form.change('email')} autoComplete="email" />
        <PasswordField id="register-password" value={form.values.password} onChange={form.change('password')} autoComplete="new-password" />
        <p className="-mt-2 text-xs text-slate-500">Use at least 8 characters.</p>
        <button type="submit" disabled={form.submitting} className="flex w-full justify-center rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
          {form.submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthFrame>
  )
}
