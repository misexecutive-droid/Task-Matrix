import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCreateUserMutation } from './hooks';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  role:      z.enum(['ADMIN', 'MANAGER', 'AGENT', 'USER', 'PC']),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFields>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'USER' },
  });

  const role = watch('role');

  const onSubmit = (data: UserFields) => {
    mutation.mutate(data, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-primary-500 shrink-0" />
            <div>
              <DialogTitle>New user</DialogTitle>
              <p className="text-xs text-text-muted mt-0.5">Create an account and assign a role.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="firstName" label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input id="lastName" label="Last name (optional)" error={errors.lastName?.message} {...register('lastName')} />
          <Input id="email" label="Email address" type="email" error={errors.email?.message} {...register('email')} />
          <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-display text-text-secondary">Role</label>
            <Select value={role} onValueChange={v => setValue('role', v as UserFields['role'])}>
              <SelectTrigger id="role" className="w-full h-11 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="PC">Person in Charge (PC)</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
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
