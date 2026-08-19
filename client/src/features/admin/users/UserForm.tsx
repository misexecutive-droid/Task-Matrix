import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input, Button, Modal, Combobox } from '../../../components';
import { useCreateUserMutation, useUpdateUserMutation, useDepartmentsQuery } from '../hook';
import { useStoresQuery } from '../../tickets/hook';
import type { AdminUser, Role } from '../../../api/admin';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'USER', label: 'User' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SENIOR', label: 'Senior (Store Head)' },
  { value: 'PC', label: 'Process coordinator (PC)' },
  { value: 'ADMIN', label: 'Admin' },
];

// Which scope dimension each role needs assigned to see role-scoped data, and the warning to
// show when it's missing. MANAGER/PC are department-scoped; SENIOR is store-scoped.
const ROLE_SCOPE_WARNING: Partial<Record<Role, { field: 'departmentId' | 'storeId'; message: string }>> = {
  MANAGER: { field: 'departmentId', message: "A Manager without a department won't see scoped data — assign one for full functionality." },
  PC: { field: 'departmentId', message: "A Process Coordinator without a department won't see scoped data — assign one for full functionality." },
  SENIOR: { field: 'storeId', message: "A Senior without a store won't see scoped data — assign one for full functionality." },
};

const buildUserSchema = (isEditing: boolean) =>
  z
    .object({
      firstName: z.string().trim().min(1, 'First name is required'),
      lastName: z.string().trim().optional(),
      email: z.string().trim().email('Enter a valid email address'),
      password: z.string().optional(),
      role: z.enum(['ADMIN', 'SENIOR', 'MANAGER', 'AGENT', 'USER', 'PC'] as const),
      departmentId: z.string().optional(),
      storeId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!isEditing && (!data.password || data.password.length < 8)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password must be at least 8 characters',
        });
      }
    });

type UserFields = z.infer<ReturnType<typeof buildUserSchema>>;

interface UserFormProps {
  onClose: () => void;
  user?: AdminUser;
  /** Called with the newly-created user right after a successful create (not fired when editing). */
  onCreated?: (user: AdminUser) => void;
  /** Seeds fields on a fresh create (e.g. a name — and department, if it was also mentioned —
   *  typed in Smart Add that didn't match anyone) without treating this as an edit — `user` above
   *  is what triggers edit mode. */
  prefill?: { firstName?: string; lastName?: string; departmentId?: string };
}

export const UserForm = ({ onClose, user, onCreated, prefill }: UserFormProps) => {
  const isEditing = Boolean(user);
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const { data: departments, isPending: isDepartmentsLoading } = useDepartmentsQuery();
  const { data: stores, isPending: isStoresLoading } = useStoresQuery();

  const schema = useMemo(() => buildUserSchema(isEditing), [isEditing]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? prefill?.firstName ?? '',
      lastName: user?.lastName ?? prefill?.lastName ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'USER',
      departmentId: user?.departmentId ?? prefill?.departmentId ?? '',
      storeId: user?.storeId ?? '',
      password: '',
    },
  });

  const [role, departmentId, storeId] = watch(['role', 'departmentId', 'storeId']);
  const isPending = mutation.isPending || isSubmitting;

  const onSubmit = (data: UserFields) => {
    const departmentPayload = data.departmentId || undefined;
    const storePayload = data.storeId || undefined;

    if (isEditing && user) {
      updateMutation.mutate(
        {
          id: user.id,
          payload: {
            firstName: data.firstName,
            lastName: data.lastName || undefined,
            email: data.email,
            role: data.role,
            departmentId: departmentPayload ?? null,
            storeId: storePayload ?? null,
          },
        },
        { onSuccess: onClose }
      );
      return;
    }

    createMutation.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password!,
        role: data.role,
        departmentId: departmentPayload,
        storeId: storePayload,
      },
      {
        onSuccess: (created) => {
          onCreated?.(created);
          onClose();
        },
      }
    );
  };

  const scopeWarning = ROLE_SCOPE_WARNING[role];
  const scopeValue = scopeWarning?.field === 'storeId' ? storeId : departmentId;
  const roleWarning = scopeWarning && !scopeValue ? scopeWarning.message : null;

  const footer = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" form="user-form" variant="primary" size="sm" isLoading={isPending}>
        {isEditing ? 'Save changes' : 'Create user'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={() => !isPending && onClose()}
      icon={<UserPlus className="w-5 h-5" />}
      title={isEditing ? 'Edit user' : 'New user'}
      description={
        isEditing
          ? "Update user's profile details, assigned role, or department."
          : 'Create a new user account and set initial permissions.'
      }
      footer={footer}
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <fieldset disabled={isPending} className="flex flex-col gap-4 disabled:opacity-60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="First name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              id="lastName"
              label="Last name (optional)"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            id="email"
            label="Email address"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {!isEditing && (
            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-[38px] text-text-light hover:text-text-secondary transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-display text-text-secondary">
              Role
            </label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Combobox
                  id="role"
                  value={field.value}
                  onChange={(value) => field.onChange(value as Role)}
                  placeholder="Search roles..."
                  options={ROLE_OPTIONS}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="departmentId" className="text-sm font-display text-text-secondary">
              Department
            </label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Combobox
                  id="departmentId"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  isLoading={isDepartmentsLoading}
                  placeholder="Search departments..."
                  emptyOptionLabel="No department"
                  options={(departments ?? []).map(d => ({ value: d.id, label: d.name }))}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="storeId" className="text-sm font-display text-text-secondary">
              Store
            </label>
            <Controller
              control={control}
              name="storeId"
              render={({ field }) => (
                <Combobox
                  id="storeId"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  isLoading={isStoresLoading}
                  placeholder="Search stores..."
                  emptyOptionLabel="No store"
                  options={(stores ?? []).map(s => ({ value: s.id, label: s.name }))}
                />
              )}
            />

            {roleWarning && (
              <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-display mt-1">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{roleWarning}</span>
              </div>
            )}
          </div>
        </fieldset>

        {mutation.isError && (
          <div className="flex items-center gap-2 text-xs text-danger font-display bg-danger/10 p-2.5 rounded-lg">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              {mutation.error instanceof Error
                ? mutation.error.message
                : `Failed to ${isEditing ? 'update' : 'create'} user.`}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};
