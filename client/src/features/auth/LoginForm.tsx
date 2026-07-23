import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router";
import { Input, Button,  } from "../../components";
import { loginSchema, type LoginFields } from "./Schemas";
import { useLoginMutation } from "./hooks";
import { AuthBackground } from "./AuthBackground";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);


  const mutation = useLoginMutation();

  
  const {
    register,    
    handleSubmit, 
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema), 
  });

  return (
    <div className="flex min-h-svh" style={{ background: "var(--bg-body)" }}>

      
      <aside
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: "var(--bg-dark)" }}
      >

        <AuthBackground  tagline ="Built for teams that move fast and never miss what matters."/>
        
      </aside>

      
      <main className="flex flex-1 items-center justify-center px-4 sm:px-8 py-10 sm:py-14 relative overflow-hidden">

       
        <span className="absolute -top-28 -right-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
        <span className="absolute -top-12 -right-12 size-44 rounded-full border border-gold-300/25 pointer-events-none" />
        <span className="absolute top-16 -right-20 size-56 rounded-full bg-primary-100/20 pointer-events-none" />
        <span className="absolute -bottom-28 -left-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
        <span className="absolute -bottom-12 -left-12 size-44 rounded-full border border-gold-300/25 pointer-events-none" />
        <span className="absolute bottom-16 -left-20 size-56 rounded-full bg-gold-100/25 pointer-events-none" />
        <span className="absolute left-10 top-[38%] size-2.5 rounded-full bg-primary-400/25 pointer-events-none" />
        <span className="absolute left-20 top-[55%] size-1.5 rounded-full bg-gold-400/25 pointer-events-none" />
        <span className="absolute right-14 bottom-[28%] size-2 rounded-full bg-primary-400/20 pointer-events-none" />
        <span className="absolute right-8 top-[35%] size-1.5 rounded-full bg-gold-400/30 pointer-events-none" />

        
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
                Welcome back
              </h2>
            </div>
            <p className="text-sm text-text-secondary font-display">
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
              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-text-light hover:text-text transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {/* swap icon based on visibility state */}
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password")}
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="font-display text-xs text-primary-600 hover:text-primary-500 transition-colors"
                  style={{ transitionDuration: "var(--transition-fast)" }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* API-level error (wrong credentials, server down, etc.)
                shown only after the request fails — field errors are above each input */}
            {mutation.isError && (
              <p className="text-xs text-danger text-center">
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
              className="mt-1 w-full font-light bg-gradient-to-r from-primary-800 via-primary-600 to-primary-700 hover:from-primary-700 hover:via-primary-500 hover:to-primary-600 text-white shadow-lg transition-all duration-300"
            >
              Sign in
            </Button>

          </form>

        </div>
      </main>

    </div>
  );
};
