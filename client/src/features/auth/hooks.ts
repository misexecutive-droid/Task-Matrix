import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import type { LoginPayload, SignupPayload } from '../../api/auth';

export const useLoginMutation = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ accessToken, user }) => {
      login(accessToken, {
        id:    user.id,
        name:  user.firstName ?? user.email,
        email: user.email,
      });
      navigate('/', { replace: true });
    },
  });
};

export const useSignupMutation = () => {
  const { login } = useAuth();   // register also logs the user in — reuse login()
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: (payload: SignupPayload) => authApi.register(payload),
    onSuccess: ({ accessToken, user }) => {
      login(accessToken, {
        id:    user.id,
        name:  user.firstName ?? user.email,
        email: user.email,
      });
      navigate('/', { replace: true });
    },
  });
};