import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Input, Button } from "../../components";
import { forgotPasswordSchema, type ForgotPasswordFields } from "./Schemas";
import { useForgotPasswordMutation } from "./hooks";
import { AuthBackground } from "./AuthBackground";

export const ForgotPasswordForm = () => {
  const mutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
  });

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
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-text">
                Reset your password
              </h2>
            </div>
            <p className="text-sm text-text-secondary font-display">
              Enter your account email and we'll send you a link to reset your password.
            </p>
          </div>

          {mutation.isSuccess ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary font-display">
                If that email is registered, a reset link is on its way. Check your inbox.
              </p>
              <Link to="/login" className="font-display text-xs text-primary-600 hover:text-primary-500 transition-colors text-center">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(d => mutation.mutate(d))}
              className="flex flex-col gap-4 sm:gap-5"
              noValidate
            >
              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={mutation.isPending}
                className="mt-1 w-full font-light bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700 hover:from-primary-700 hover:via-primary-500 hover:to-primary-600 text-white shadow-lg transition-all duration-300"
              >
                Send reset link
              </Button>

              <Link to="/login" className="font-display text-xs text-primary-600 hover:text-primary-500 transition-colors text-center">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
