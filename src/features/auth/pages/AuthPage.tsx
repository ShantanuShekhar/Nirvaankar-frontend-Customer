import { authApi } from '@/api/endpoints/identity'
import { resumePendingAuthAction, safeReturnPath } from '@/features/auth/pendingAuthAction'
import {
  buildWebDevicePayload,
  createIdempotencyKey,
  normalizeLoginIdentifier,
  toE164Phone,
} from '@/shared/utils/helpers'
import { getErrorMessage, mapFieldErrors } from '@/shared/utils/errors'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

function phoneOrEmptyOk(value: string | undefined): true | string {
  if (!value?.trim()) return true
  return toE164Phone(value) ? true : 'Enter a valid phone, e.g. 7079473505 or +917079473505'
}

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(8, 'At least 8 characters').max(72),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
  })
  .superRefine((values, ctx) => {
    const phoneCheck = phoneOrEmptyOk(values.phone)
    if (phoneCheck !== true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneCheck, path: ['phone'] })
    }
    if (!values.email && !values.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide an email or phone number',
        path: ['email'],
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const otpPhoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone is required')
    .refine((value) => Boolean(toE164Phone(value)), {
      message: 'Enter a valid phone, e.g. 7079473505 or +917079473505',
    }),
})

type OtpPhoneFormValues = z.infer<typeof otpPhoneSchema>

const otpCodeSchema = z.object({
  code: z.string().min(4).max(8),
})

type OtpCodeFormValues = z.infer<typeof otpCodeSchema>

type Mode = 'password' | 'otp' | 'register'

export function AuthPage({ initialMode = 'password' as Mode }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const registerKeyRef = useRef(createIdempotencyKey())
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const requestedNext = params.get('next')
  const next = safeReturnPath(
    !requestedNext || requestedNext === '/account' ? '/shop' : requestedNext,
    '/shop',
  )

  async function finishAuth(session: Parameters<typeof setSession>[0]) {
    setSession(session)
    const destination = await resumePendingAuthAction(next)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] }),
    ])
    navigate(destination, { replace: true })
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', phone: '', password: '', firstName: '', lastName: '' },
  })
  const otpPhoneForm = useForm<OtpPhoneFormValues>({
    resolver: zodResolver(otpPhoneSchema),
    defaultValues: { phone: '' },
  })
  const otpCodeForm = useForm<OtpCodeFormValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: '' },
  })

  const device = useMemo(() => buildWebDevicePayload(), [])

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      authApi.login({
        identifier: normalizeLoginIdentifier(values.identifier),
        password: values.password,
        device,
      }),
    onSuccess: async ({ data }) => {
      await finishAuth(data)
    },
    onError: (error) => {
      setFormError(getErrorMessage(error))
      const fields = mapFieldErrors(error)
      Object.entries(fields).forEach(([k, v]) =>
        loginForm.setError(k as 'identifier' | 'password', { message: v }),
      )
    },
  })

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => {
      const phone = values.phone?.trim() ? toE164Phone(values.phone) ?? undefined : undefined
      return authApi.register(
        {
          email: values.email || undefined,
          phone,
          password: values.password,
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          device,
        },
        registerKeyRef.current,
      )
    },
    onSuccess: async ({ data }) => {
      registerKeyRef.current = createIdempotencyKey()
      await finishAuth(data)
    },
    onError: (error) => {
      setFormError(getErrorMessage(error))
    },
  })

  const otpRequestMutation = useMutation({
    mutationFn: (values: OtpPhoneFormValues) => {
      const phone = toE164Phone(values.phone)
      if (!phone) throw new Error('Invalid phone number')
      return authApi.requestOtp({ phone })
    },
    onSuccess: ({ data }, variables) => {
      setOtpPhone(toE164Phone(variables.phone) ?? variables.phone)
      setOtpDevCode(data.devCode)
      setFormError(null)
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const otpVerifyMutation = useMutation({
    mutationFn: (values: OtpCodeFormValues) =>
      authApi.verifyOtp({ phone: otpPhone, code: values.code, device }),
    onSuccess: async ({ data }) => {
      await finishAuth(data)
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--color-forest-900)] px-8 py-12 text-[var(--color-cream-50)] shadow-[var(--shadow-soft)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(196,164,132,0.25),transparent_45%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-cream-200)]">Welcome</p>
          <h1 className="mt-3 font-display text-5xl leading-tight">
            Join a calmer way to shop handmade.
          </h1>
          <p className="mt-4 max-w-md text-[var(--color-cream-200)]">
            One identity for customer, seller and care — signed in securely with short-lived access
            tokens.
          </p>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="mb-6 flex gap-2 rounded-full bg-[var(--color-bg-muted)] p-1 text-sm">
          {(
            [
              ['password', 'Password'],
              ['otp', 'OTP'],
              ['register', 'Register'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`flex-1 rounded-full px-3 py-2 transition ${mode === key ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)]' : 'text-[var(--color-fg-muted)]'}`}
              onClick={() => {
                setMode(key)
                setFormError(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {formError ? (
          <p className="mb-4 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]" role="alert">
            {formError}
          </p>
        ) : null}

        {mode === 'password' ? (
          <form
            className="space-y-4"
            onSubmit={loginForm.handleSubmit((values) => {
              setFormError(null)
              loginMutation.mutate(values)
            })}
          >
            <Input
              label="Email or phone"
              autoComplete="username"
              hint="Phone without +91 is fine"
              error={loginForm.formState.errors.identifier?.message}
              {...loginForm.register('identifier')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />
            <Button type="submit" className="w-full" loading={loginMutation.isPending}>
              Sign in
            </Button>
          </form>
        ) : null}

        {mode === 'register' ? (
          <form
            className="space-y-4"
            onSubmit={registerForm.handleSubmit((values) => {
              setFormError(null)
              registerMutation.mutate(values)
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                error={registerForm.formState.errors.firstName?.message}
                {...registerForm.register('firstName')}
              />
              <Input
                label="Last name"
                error={registerForm.formState.errors.lastName?.message}
                {...registerForm.register('lastName')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={registerForm.formState.errors.email?.message}
              {...registerForm.register('email')}
            />
            <Input
              label="Phone"
              placeholder="7079473505 or +917079473505"
              inputMode="tel"
              hint="Indian numbers can be entered without +91"
              error={registerForm.formState.errors.phone?.message}
              {...registerForm.register('phone')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              error={registerForm.formState.errors.password?.message}
              {...registerForm.register('password')}
            />
            <Button type="submit" className="w-full" loading={registerMutation.isPending}>
              Create account
            </Button>
          </form>
        ) : null}

        {mode === 'otp' ? (
          <div className="space-y-4">
            {!otpPhone ? (
              <form
                className="space-y-4"
                onSubmit={otpPhoneForm.handleSubmit((values) => {
                  setFormError(null)
                  otpRequestMutation.mutate(values)
                })}
              >
                <Input
                  label="Phone"
                  placeholder="7079473505 or +917079473505"
                  inputMode="tel"
                  hint="Indian numbers can be entered without +91"
                  error={otpPhoneForm.formState.errors.phone?.message}
                  {...otpPhoneForm.register('phone')}
                />
                <Button type="submit" className="w-full" loading={otpRequestMutation.isPending}>
                  Send code
                </Button>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={otpCodeForm.handleSubmit((values) => {
                  setFormError(null)
                  otpVerifyMutation.mutate(values)
                })}
              >
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Enter the code sent to your phone.
                  {otpDevCode ? ` Dev code: ${otpDevCode}` : null}
                </p>
                <Input
                  label="OTP code"
                  inputMode="numeric"
                  error={otpCodeForm.formState.errors.code?.message}
                  {...otpCodeForm.register('code')}
                />
                <Button type="submit" className="w-full" loading={otpVerifyMutation.isPending}>
                  Verify & sign in
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpPhone('')}>
                  Use a different number
                </Button>
              </form>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          <Link to="/" className="underline-offset-2 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
