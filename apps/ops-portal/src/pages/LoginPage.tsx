import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginInput } from '@esg/shared-validation';
import { Button, Input, Label } from '@esg/ui';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export function LoginPage() {
  const { login, status } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // The Supplier/Client tabs are visual, matching the Figma login screen —
  // both post to the same /auth/login; the backend returns whatever role
  // the account actually has, and AuthContext rejects a CLIENT_USER here
  // (see its NOT_A_STAFF_ACCOUNT guard) regardless of which tab was active.
  const [tab, setTab] = useState<'supplier' | 'client'>('supplier');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (status === 'authenticated') {
    return <Navigate to="/work-orders" replace />;
  }

  async function onSubmit(input: LoginInput) {
    setServerError(null);
    try {
      await login(input);
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_A_STAFF_ACCOUNT') {
        setServerError('NOT_A_STAFF_ACCOUNT');
      } else {
        setServerError(err instanceof ApiError ? err.code : 'AUTH.INVALID_CREDENTIALS');
      }
    }
  }

  return (
    <main className="bg-[#0a1628] flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[460px] rounded-xl bg-white p-12 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h1 className="text-[28px] font-bold text-[#0a1628]">Wing Kai Recycle</h1>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#008660]">ESG Auditing Portal</p>
        </div>

        <div role="tablist" aria-label="Account type" className="mb-6 flex overflow-hidden rounded-lg border border-[#e2e8f0]">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'supplier'}
            onClick={() => setTab('supplier')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'supplier' ? 'bg-[#10233d] text-white' : 'bg-[#f8fafc] text-[#64748b]'
            }`}
          >
            Supplier Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'client'}
            onClick={() => setTab('client')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'client' ? 'bg-[#10233d] text-white' : 'bg-[#f8fafc] text-[#64748b]'
            }`}
          >
            Client Login
          </button>
        </div>

        {tab === 'client' && (
          <p className="mb-4 rounded-md bg-[var(--color-status-info-bg)] p-3 text-sm text-[var(--color-status-info-fg)]">
            Client accounts sign in at the Client Portal instead — this staff portal is for recycling-facility and
            auditor accounts.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          {serverError && (
            <div role="alert" className="rounded-md bg-[var(--color-status-danger-bg)] p-3 text-sm text-[var(--color-status-danger-fg)]">
              {serverError === 'NOT_A_STAFF_ACCOUNT'
                ? 'This account is a client account — please use the Client Portal instead.'
                : 'The email or password you entered is incorrect.'}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[13px] font-semibold text-[#1e293b]">
              Corporate Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                className="bg-[#f8fafc] pl-10"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-[var(--color-status-danger-fg)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[13px] font-semibold text-[#1e293b]">
                Password
              </Label>
              <a href="#forgot" className="text-[13px] font-medium text-[#008660] hover:underline">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
                className="bg-[#f8fafc] pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b]"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-[var(--color-status-danger-fg)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            // Default variant resolves bg-primary/text-primary-foreground to
            // --color-action-green (index.css) — the WCAG-safe green, not
            // the raw Figma #00a878 (white text on that measures 3.06:1,
            // below the 4.5:1 AA minimum for this button's text size). Never
            // hardcode `bg-[#00a878]` with white text for this reason.
            className="w-full py-6 text-[15px] font-semibold shadow-[0_4px_6px_rgba(0,168,120,0.25)]"
          >
            {isSubmitting ? 'Signing in…' : `Sign In as ${tab === 'supplier' ? 'Supplier' : 'Client'}`}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-[#64748b]">
            Secured by <span className="font-semibold text-[#1e293b]">Arup Environmental Consultants</span>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#00a878]" aria-hidden="true" />
            <span className="text-[11px] font-medium text-[#64748b]">WCAG AA+ Compliant</span>
          </div>
        </div>
      </div>
    </main>
  );
}
