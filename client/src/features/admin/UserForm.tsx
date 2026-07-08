import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Input, Button } from '../../components';
import { useCreateUserMutation } from './hooks';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  role:      z.enum(['ADMIN', 'MANAGER', 'AGENT', 'USER']),
});

type UserFields = z.infer<typeof userSchema>;

interface UserFormProps {
  onClose: () => void;
}

export const UserForm = ({ onClose }: UserFormProps) => {
  const mutation = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFields>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'USER' },
  });

  const onSubmit = (data: UserFields) => {
    mutation.mutate(data, { onSuccess: () => onClose() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col gap-6 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-slate-900">New user</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="firstName" label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input id="lastName" label="Last name (optional)" error={errors.lastName?.message} {...register('lastName')} />
          <Input id="email" label="Email address" type="email" error={errors.email?.message} {...register('email')} />
          <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-display text-slate-700">Role</label>
            <select
              id="role"
              className="w-full px-3 h-11 sm:h-10 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 transition-colors cursor-pointer"
              {...register('role')}
            >
              <option value="USER">User</option>
              <option value="AGENT">Agent</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create user.'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>Create user</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
