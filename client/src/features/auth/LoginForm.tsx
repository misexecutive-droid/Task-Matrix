// useState — only used for the password eye-toggle now (loading lives in mutation)
import { useState } from "react";
// useForm — manages field values, validation state, and handleSubmit wrapper
import { useForm } from "react-hook-form";
// zodResolver — bridges zod schema into react-hook-form validation
import { zodResolver } from "@hookform/resolvers/zod";
// Eye / EyeOff — lucide icons swapped on the password toggle button
import { Eye, EyeOff } from "lucide-react";
// NavLink — like <a> but marks itself active when the route matches
import { NavLink } from "react-router";
// shared design-system components
import { Input, Button, ModernHeroTitle } from "../../components";
// loginSchema = zod rules | LoginFields = TypeScript type inferred from schema
import { loginSchema, type LoginFields } from "./Schemas";
// useLoginMutation — calls authApi.login → saves token → navigates to "/"
import { useLoginMutation } from "./hooks";

export const LoginForm = () => {
  // controls whether password field shows plain text or dots
  const [showPassword, setShowPassword] = useState(false);

  // mutation must live INSIDE the component — hooks cannot be called at module level
  // isPending = true while the API request is in flight
  // isError   = true if the request threw (network error, 401, etc.)
  // error     = the Error object thrown by authApi.login
  // mutate    = call this with form data to trigger the API call
  const mutation = useLoginMutation();

  // useForm wires up validation against loginSchema
  // errors = field-level zod messages (shown under each Input)
  const {
    register,     // connects each input to react-hook-form
    handleSubmit, // wraps our submit fn: validates first, calls fn only on pass
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema), // zod runs on every submit attempt
  });

  return (
    <div className="flex min-h-svh" style={{ background: "var(--bg-body)" }}>

      {/* ── Left dark panel ── */}
      <aside
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: "var(--bg-dark)" }}
      >
        <span className="absolute inset-6 border border-primary-400/20 rounded-xl pointer-events-none" />
        <span className="absolute -left-28 top-1/2 -translate-y-1/2 size-80 rounded-full border border-indigo-400/20 pointer-events-none" />
        <span className="absolute -left-40 top-1/2 -translate-y-1/2 size-[28rem] rounded-full border border-indigo-400/10 pointer-events-none" />
        <span className="absolute -right-14 top-12 size-56 rounded-full border border-primary-400/20 pointer-events-none" />
        <span className="absolute -right-20 bottom-12 size-40 rounded-full border border-primary-400/15 pointer-events-none" />
        <span className="absolute -right-6 top-1/2 -translate-y-1/2 size-24 rounded-full bg-indigo-500/10 pointer-events-none" />

        <div className="flex flex-col gap-6">
          <ModernHeroTitle />
          <p className="text-white/50 text-sm leading-relaxed max-w-xs font-display">
            Built for teams that move fast and never miss what matters.
          </p>
        </div>

        <p className="text-white/15 text-xs font-display tracking-widest uppercase">
          &copy; {new Date().getFullYear()} TaskMatrix
        </p>
      </aside>

      {/* ── Right form panel ── */}
      <main className="flex flex-1 items-center justify-center px-4 sm:px-8 py-10 sm:py-14 relative overflow-hidden">

        {/* Decorative rings — pointer-events-none so they never block clicks */}
        <span className="absolute -top-28 -right-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
        <span className="absolute -top-12 -right-12 size-44 rounded-full border border-indigo-300/20 pointer-events-none" />
        <span className="absolute top-16 -right-20 size-56 rounded-full bg-primary-100/20 pointer-events-none" />
        <span className="absolute -bottom-28 -left-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
        <span className="absolute -bottom-12 -left-12 size-44 rounded-full border border-indigo-300/20 pointer-events-none" />
        <span className="absolute bottom-16 -left-20 size-56 rounded-full bg-indigo-100/20 pointer-events-none" />
        <span className="absolute left-10 top-[38%] size-2.5 rounded-full bg-primary-400/25 pointer-events-none" />
        <span className="absolute left-20 top-[55%] size-1.5 rounded-full bg-indigo-400/20 pointer-events-none" />
        <span className="absolute right-14 bottom-[28%] size-2 rounded-full bg-primary-400/20 pointer-events-none" />
        <span className="absolute right-8 top-[35%] size-1.5 rounded-full bg-indigo-400/25 pointer-events-none" />

        {/* z-10 keeps card above the decorative rings */}
        <div
          className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-sm border rounded-xl shadow-xl flex flex-col gap-6 sm:gap-8 p-6 sm:p-8"
          style={{
            background:     "var(--glass-bg)",
            borderColor:    "var(--glass-border)",
            backdropFilter: "var(--glass-blur)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="pb-3 border-b-2 border-primary-500">
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-slate-900">
                Welcome back
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-display">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Form
              handleSubmit(fn) — zod runs first; fn only fires when all fields pass
              d => mutation.mutate(d) — passes validated data straight to the hook  */}
          <form
            onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="flex flex-col gap-4 sm:gap-5"
            noValidate
          >
            {/* register("email") spreads name/ref/onChange/onBlur into Input
                errors.email?.message = zod error string or undefined          */}
            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="flex flex-col gap-1.5">
              {/* type switches between "password" (dots) and "text" (visible) */}
              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                suffix={
                  // suffix renders inside the Input on the right edge
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {/* swap icon based on visibility state */}
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password")}
              />
              <div className="flex justify-end">
                <a
                  href="#"
                  className="font-display text-xs text-primary-600 hover:text-primary-500 transition-colors"
                  style={{ transitionDuration: "var(--transition-fast)" }}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* API-level error (wrong credentials, server down, etc.)
                shown only after the request fails — field errors are above each input */}
            {mutation.isError && (
              <p className="text-xs text-red-500 text-center">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Login failed. Please try again."}
              </p>
            )}

            {/* isLoading uses mutation.isPending — true while fetch is in flight
                Button shows a spinner automatically when isLoading is true       */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={mutation.isPending}
              className="mt-1 w-full font-light bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300"
            >
              Sign in
            </Button>

          </form>

          {/* Footer link to signup */}
          <p className="text-center text-xs sm:text-sm text-slate-400 font-display">
            Don&apos;t have an account?{" "}
            <NavLink
              to="/signup"
              className="font-semibold text-primary-700 hover:text-primary-600 transition-colors"
              style={{ transitionDuration: "var(--transition-fast)" }}
            >
              Sign up
            </NavLink>
          </p>

        </div>
      </main>

    </div>
  );
};
