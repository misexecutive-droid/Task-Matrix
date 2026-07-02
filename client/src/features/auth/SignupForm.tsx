import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { NavLink } from "react-router"; // Fixed case from Navlink to NavLink
import { Button, Input, ModernHeroTitle } from "../../components";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFields } from "./Schemas";
import { useSignupMutation } from "./hooks";

const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
        type="button"
        onClick={onToggle}
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        aria-label={show ? "Hide" : "Show"}
    >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
);

export const SignupForm = () => {
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFields>({
        resolver: zodResolver(signupSchema),
    });

    const mutation = useSignupMutation();

    return (
        <>
            <div className="flex min-h-svh" style={{ background: "var(--bg-body)" }}>
                {/* Left Sidebar */}
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

                    <div className="flex flex-col gap-6" >
                        <ModernHeroTitle />
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs font-display">
                            Join teams that move fast and never miss what matters.
                        </p>
                    </div>
                    <p className="text-white/15 text-xs font-display tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} TaskMatrix
                    </p>
                </aside>

                {/* Right Form Container */}
                <main className="flex flex-1 items-center justify-center px-4 sm:px-8 py-10 sm:py-14 relative overflow-hidden">
                    <span className="absolute -top-28 -right-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
                    <span className="absolute -top-12 -right-12 size-44 rounded-full border border-indigo-300/20 pointer-events-none" />
                    <span className="absolute top-16 -right-20 size-56 rounded-full bg-primary-100/20 pointer-events-none" />
                    <span className="absolute -bottom-28 -left-28 size-80 rounded-full border border-primary-300/15 pointer-events-none" />
                    <span className="absolute -bottom-12 -left-12 size-44 rounded-full border border-indigo-300/20 pointer-events-none" />
                    <span className="absolute bottom-16 -left-20 size-56 rounded-full bg-indigo-100/20 pointer-events-none" />
                    <span className="absolute left-10 top-[38%] size-2.5 rounded-full bg-primary-400/25 pointer-events-none" />
                    <span className="absolute right-14 bottom-[28%] size-2 rounded-full bg-primary-400/20 pointer-events-none" />

                    <div
                        className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-sm border rounded-xl shadow-xl flex flex-col gap-6 sm:gap-8 p-6 sm:p-8"
                        style={{
                            background: "var(--glass-bg)",
                            borderColor: "var(--glass-border)",
                            backdropFilter: "var(--glass-blur)",
                        }}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="pb-3 border-b-2 border-primary-500">
                                <h2 className="text-xl sm:text-2xl font-display font-semibold text-slate-900">
                                    Create Account
                                </h2>
                            </div>
                            <p className="text-sm text-slate-500 font-display">
                                Get started with your workspace today.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit(({ confirmPassword: _cp, ...payload }) => mutation.mutate(payload))}
                            className="flex flex-col gap-4 sm:gap-5"
                            noValidate
                        >
                            <Input
                                id="firstName"
                                label="Full name"
                                type="text"
                                placeholder="Jane Smith"
                                autoComplete="given-name"
                                error={errors.firstName?.message}
                                {...register("firstName")}
                            />

                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                error={errors.email?.message}
                                {...register("email")}
                            />

                            <Input
                                id="password"
                                label="Password"
                                type={showPw ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                                error={errors.password?.message}
                                suffix={<EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />}
                                {...register("password")}
                            />

                            <Input
                                id="confirmPassword"
                                label="Confirm password"
                                type={showCpw ? "text" : "password"}
                                placeholder="Re-enter password"
                                autoComplete="new-password"
                                error={errors.confirmPassword?.message}
                                suffix={<EyeToggle show={showCpw} onToggle={() => setShowCpw(v => !v)} />}
                                {...register("confirmPassword")}
                            />

                            {mutation.isError && (
                                <p className="text-xs text-red-500 text-center">
                                    {mutation.error instanceof Error
                                        ? mutation.error.message
                                        : "Registration failed. Please try again."}
                                </p>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={mutation.isPending}
                                className="mt-1 w-full font-light bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300"
                            >
                                Create account
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-xs sm:text-sm text-slate-400 font-display">
                            Already have an account?{" "}
                            <NavLink
                                to="/login"
                                className="font-semibold text-primary-700 hover:text-primary-600 transition-colors"
                                style={{ transitionDuration: "var(--transition-fast)" }}
                            >
                                Sign in
                            </NavLink>
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
};