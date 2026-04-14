import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
    });

    const { signup, isSigningUp } = useAuthStore();

    // Runs quick client-side checks and shows a toast for the first problem found.
    // Returns true only when everything looks good — the caller treats any other
    // return value (including undefined) as a failure.
    const validateForm = () => {
        if (!formData.fullName.trim()) return toast.error("Full name is required");
        if (!formData.email.trim()) return toast.error("Email is required");
        if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
        if (!formData.password) return toast.error("Password is required");
        if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        const success = validateForm();
    
        if (success === true) signup(formData);
    };

    return <div className="min-h-screen grid lg:grid-cols-2">
        {/* Sign-up form — takes up the full screen on mobile, left half on desktop */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
            <div className="w-full max-w-md space-y-8">
                {/* App icon and page heading */}
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <MessageSquare className="size-6 text-primary"/>
                        </div>
                        <h1 className="text-2xl font-bold mt-2">Create an account</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Full Name</span>
                        </label>
                        <label className="input input-bordered flex items-center gap-2 w-full">
                            <User className="h-4 w-4 text-base-content/40 shrink-0" />
                            <input
                                type="text"
                                className="grow"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Email</span>
                        </label>
                        <label className="input input-bordered flex items-center gap-2 w-full">
                            <Mail className="h-4 w-4 text-base-content/40 shrink-0" />
                            <input
                                type="email"
                                className="grow"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Password</span>
                        </label>
                        <label className="input input-bordered flex items-center gap-2 w-full">
                            <Lock className="h-4 w-4 text-base-content/40 shrink-0" />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="grow"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                className="shrink-0"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {/* Toggle between showing and hiding the password */}
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-base-content/40" />
                                ) : (
                                    <Eye className="h-4 w-4 text-base-content/40" />
                                )}
                            </button>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
                        {isSigningUp ? (
                            <>
                            <Loader2 className="size-5 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-base-content/60">
                        Already have an account?{" "}
                        <Link to="/login" className="link link-primary">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>

        {/* Animated illustration panel — hidden on small screens */}
        <AuthImagePattern
            title="Join our community"
            subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
        />
    </div>;
};

export default SignUpPage;