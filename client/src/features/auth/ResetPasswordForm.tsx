import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Input, Button } from "../../components";
import { resetPasswordSchema, type ResetPasswordFields } from "./Schemas";
import { useResetPasswordMutation } from "./hooks";
import { AuthBackground } from "./AuthBackground";

export const ResetPasswordForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const mutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFields) => {
    if (!token) return;
    mutation.mutate({ token, password: data.password });
  };

  return (
    <div className="flex min-h-svh" style={{ background: "var(--bg-body)" }}>
      <aside
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: "var(--bg-dark)" }}
      >
        <AuthBackground tagline="Built for teams that move fast and never miss what matters." />
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 sm:px-8 py-10 sm:py-14 relative overflow-hidden">
        <div
          className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-sm border rounded-xl shadow-xl flex flex-col gap-6 sm:gap-8 p-6 sm:p-8"
          style={{
            background:     "var(--glass-bg)",
            borderColor:    "var(--glass-border)",
            backdropFilter: "var(--glass-blur)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="pb-3 border-b-2 border-primary-500">
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-slate-900">
                Choose a new password
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-display">
              Enter a new password for your account.
            </p>
          </div>

          {!token ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-red-500 text-center">
                This reset link is missing or invalid. Request a new one below.
              </p>
              <Link to="/forgot-password" className="font-display text-xs text-primary-600 hover:text-primary-500 transition-colors text-center">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4 sm:gap-5"
              noValidate
            >
              <Input
                id="password"
                label="New password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password")}
              />

              <Input
                id="confirmPassword"
                label="Confirm new password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              {mutation.isError && (
                <p className="text-xs text-red-500 text-center">
                  {mutation.error instanceof Error ? mutation.error.message : "Failed to reset password."}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={mutation.isPending}
                className="mt-1 w-full font-light bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700 hover:from-primary-700 hover:via-primary-500 hover:to-primary-600 text-white shadow-lg transition-all duration-300"
              >
                Reset password
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
