import { addressApi, authApi, profileApi } from '@/api/endpoints/identity'
import { getErrorMessage } from '@/shared/utils/errors'
import { toE164Phone } from '@/shared/utils/helpers'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Package } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'

const profileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  locale: z
    .string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Use format like en-IN')
    .optional()
    .or(z.literal('')),
})

const addressSchema = z.object({
  label: z.enum(['home', 'office', 'other']).optional(),
  contactName: z.string().min(1).max(100),
  contactPhone: z
    .string()
    .min(1, 'Phone is required')
    .refine((value) => Boolean(toE164Phone(value)), {
      message: 'Enter a valid phone, e.g. 7079473505 or +917079473505',
    }),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  landmark: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  makeDefault: z.boolean(),
})

export function AccountPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const [message, setMessage] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await profileApi.getMe()).data,
  })

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await addressApi.list()).data,
  })

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: async () => (await profileApi.listDevices()).data,
  })

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: meQuery.data?.firstName ?? '',
      lastName: meQuery.data?.lastName ?? '',
      locale: meQuery.data?.locale ?? '',
    },
  })

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'home',
      contactName: '',
      contactPhone: '',
      line1: '',
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      makeDefault: true,
    },
  })

  const updateProfile = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      profileApi.updateMe({
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        locale: values.locale || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      setMessage('Profile updated')
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const createAddress = useMutation({
    mutationFn: (values: z.infer<typeof addressSchema>) => {
      const contactPhone = toE164Phone(values.contactPhone)
      if (!contactPhone) throw new Error('Invalid phone number')
      return addressApi.create({ ...values, contactPhone })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowAddressForm(false)
      addressForm.reset()
      setMessage('Address saved')
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const setDefault = useMutation({
    mutationFn: (id: number) => addressApi.setDefault(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const removeAddress = useMutation({
    mutationFn: (id: number) => addressApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const deactivateDevice = useMutation({
    mutationFn: (id: number) => profileApi.deactivateDevice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  async function handleLogout() {
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken })
      }
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  if (meQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (meQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={getErrorMessage(meQuery.error)} onRetry={() => meQuery.refetch()} />
      </div>
    )
  }

  const me = meQuery.data!

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Account</p>
          <h1 className="font-display text-4xl text-[var(--color-brand)]">
            {me.firstName ? `Hi, ${me.firstName}` : 'Your profile'}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">Manage profile, addresses and devices.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/orders">
              <Button variant="soft" size="sm">
                <Package size={14} /> Orders
              </Button>
            </Link>
            <Link to="/wishlist">
              <Button variant="secondary" size="sm">
                Wishlist
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="secondary" size="sm">
                Bag
              </Button>
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {[me.email, me.phone].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex gap-2">
          {me.roles.includes('admin') ? (
            <Link to="/admin/products">
              <Button variant="secondary">Product images</Button>
            </Link>
          ) : null}
          <Link to="/orders">
            <Button variant="secondary">
              <Package size={16} /> Orders
            </Button>
          </Link>
          <Link to="/wishlist">
            <Button variant="soft">Wishlist</Button>
          </Link>
          <Button variant="ghost" onClick={() => void handleLogout()}>
            Sign out
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
        <h2 className="font-display text-2xl text-[var(--color-brand)]">Profile</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
        >
          <Input label="First name" error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')} />
          <Input label="Last name" error={profileForm.formState.errors.lastName?.message} {...profileForm.register('lastName')} />
          <Input label="Locale" hint="e.g. en-IN" error={profileForm.formState.errors.locale?.message} {...profileForm.register('locale')} />
          <div className="flex items-end">
            <Button type="submit" loading={updateProfile.isPending}>
              Save profile
            </Button>
          </div>
        </form>
        <p className="mt-4 text-xs text-[var(--color-fg-muted)]">
          Roles: {me.roles.join(', ') || 'customer'}
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-[var(--color-brand)]">Addresses</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowAddressForm((v) => !v)}>
            {showAddressForm ? 'Cancel' : 'Add address'}
          </Button>
        </div>

        {showAddressForm ? (
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={addressForm.handleSubmit((values) => createAddress.mutate(values))}
          >
            <Input label="Contact name" error={addressForm.formState.errors.contactName?.message} {...addressForm.register('contactName')} />
            <Input
              label="Phone"
              placeholder="7079473505 or +917079473505"
              inputMode="tel"
              hint="Indian numbers can be entered without +91"
              error={addressForm.formState.errors.contactPhone?.message}
              {...addressForm.register('contactPhone')}
            />
            <Input label="Line 1" className="sm:col-span-2" error={addressForm.formState.errors.line1?.message} {...addressForm.register('line1')} />
            <Input label="Line 2" className="sm:col-span-2" {...addressForm.register('line2')} />
            <Input label="City" error={addressForm.formState.errors.city?.message} {...addressForm.register('city')} />
            <Input label="State" error={addressForm.formState.errors.state?.message} {...addressForm.register('state')} />
            <Input label="Pincode" error={addressForm.formState.errors.pincode?.message} {...addressForm.register('pincode')} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...addressForm.register('makeDefault')} />
              Make default
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" loading={createAddress.isPending}>
                Save address
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mt-6 space-y-3">
          {addressesQuery.isLoading ? <Skeleton className="h-24 w-full" /> : null}
          {addressesQuery.data?.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title="No addresses yet"
              description="Add a delivery address for checkout when orders go live."
            />
          ) : null}
          {addressesQuery.data?.map((address) => (
            <article
              key={address.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
            >
              <div>
                <p className="font-medium">
                  {address.contactName}
                  {address.isDefault ? (
                    <span className="ml-2 text-xs text-[var(--color-accent)]">Default</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                  <br />
                  {address.city}, {address.state} {address.pincode}
                </p>
              </div>
              <div className="flex gap-2">
                {!address.isDefault ? (
                  <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(address.id)}>
                    Set default
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => removeAddress.mutate(address.id)}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
        <h2 className="font-display text-2xl text-[var(--color-brand)]">Devices</h2>
        <ul className="mt-4 space-y-3">
          {devicesQuery.data?.map((device) => (
            <li
              key={device.deviceId}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {device.platform}
                  {device.current ? ' · this device' : ''}
                </p>
                <p className="text-[var(--color-fg-muted)]">
                  {device.model || 'Unknown model'}
                  {device.lastSeenAt ? ` · last seen ${new Date(device.lastSeenAt).toLocaleString()}` : ''}
                </p>
              </div>
              {!device.current ? (
                <Button size="sm" variant="ghost" onClick={() => deactivateDevice.mutate(device.deviceId)}>
                  Sign out
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
