import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCreateUserMutation, useUpdateUserMutation, useDepartmentsQuery } from './hook';
import type { AdminUser, Role } from '../../api/admin';

const NO_DEPARTMENT = '__none__';

const ROLE_WARNINGS: Partial<Record<Role, string>> = {
  MANAGER: "A Manager without a department won't see scoped data — assign one for full functionality.",
  PC: "A Process Coordinator without a department won't see scoped data — assign one for full functionality.",
};

const buildUserSchema = (isEditing: boolean) =>
  z
    .object({
      firstName: z.string().trim().min(1, 'First name is required'),
      lastName: z.string().trim().optional(),
      email: z.string().trim().email('Enter a valid email address'),
      password: z.string().optional(),
      role: z.enum(['ADMIN', 'MANAGER', 'AGENT', 'USER', 'PC'] as const),
      departmentId: z.string().optional(),
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
}

export const UserForm = ({ onClose, user }: UserFormProps) => {
  const isEditing = Boolean(user);
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const { data: departments, isPending: isDepartmentsLoading } = useDepartmentsQuery();

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
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'USER',
      departmentId: user?.departmentId ?? '',
      password: '',
    },
  });

  const [role, departmentId] = watch(['role', 'departmentId']);
  const isPending = mutation.isPending || isSubmitting;

  const onSubmit = (data: UserFields) => {
    const departmentPayload =
      data.departmentId && data.departmentId !== NO_DEPARTMENT ? data.departmentId : undefined;

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
      },
      { onSuccess: onClose }
    );
  };

  const roleWarning = !departmentId || departmentId === NO_DEPARTMENT ? ROLE_WARNINGS[role] : null;

  return (
    <Dialog open onOpenChange={open => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit user' : 'New user'}</DialogTitle>
              <p className="text-xs text-text-muted mt-0.5">
                {isEditing
                  ? "Update user's profile details, assigned role, or department."
                  : 'Create a new user account and set initial permissions.'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2" noValidate>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="PC">Process coordinator (PC)</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={field.value || NO_DEPARTMENT}
                    onValueChange={v => field.onChange(v === NO_DEPARTMENT ? '' : v)}
                    disabled={isDepartmentsLoading}
                  >
                    <SelectTrigger id="departmentId" className="w-full h-10 text-sm">
                      <SelectValue
                        placeholder={
                          isDepartmentsLoading ? 'Loading departments...' : 'Select department'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DEPARTMENT} className="text-text-muted">
                        No department
                      </SelectItem>
                      {(departments ?? []).map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
              {isEditing ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};