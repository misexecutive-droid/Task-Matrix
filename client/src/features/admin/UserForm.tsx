import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="firstName" label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input id="lastName" label="Last name (optional)" error={errors.lastName?.message} {...register('lastName')} />
          <Input id="email" label="Email address" type="email" error={errors.email?.message} {...register('email')} />
          <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-display text-text-secondary">Role</label>
            <select
              id="role"
              className="w-full px-3 h-11 sm:h-10 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors cursor-pointer"
              {...register('role')}
            >
              <option value="USER">User</option>
              <option value="AGENT">Agent</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {mutation.isError && (
            <p className="text-xs text-danger text-center">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create user.'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>Create user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
