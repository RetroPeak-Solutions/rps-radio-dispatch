import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, XCircle, Shield, Users } from "lucide-react";
import "@layouts/Auth/autofill.css";
import { AuthForgotPassword, AuthUser } from "@utils/link";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log('Forgot Password Route Loaded!');
  }, [])

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
         const userRes = await axios.get(AuthUser(), {
          withCredentials: true,
        });
        if (userRes.data.user) navigate("/");
      } catch {}
    }
    fetchCurrentUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await axios.post(AuthForgotPassword(), { email }, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("success");
      setMessage("If an account exists for this email, a password reset link has been sent.");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Something went wrong. Please try again later.");
    }
  };

  const StatusIcon = () => {
    if (status === "loading") return <Loader2 className="animate-spin text-primary" size={28} />;
    if (status === "success") return <CheckCircle className="text-green-500" size={28} />;
    if (status === "error") return <XCircle className="text-red-500" size={28} />;
    return <Mail className="text-muted-foreground" size={28} />;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground selection:bg-primary/20">

      {/* Left Branding & Stats */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="lg:w-1/2 flex flex-col justify-center px-16 py-20 bg-gradient-to-br from-primary/10 to-blue-600/10 backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-pulse-slow" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl mix-blend-screen animate-pulse-slow" />

        <h1 className="text-5xl font-display font-bold mb-6 max-w-lg leading-tight">
          Reset Your <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400">Password</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-12">
          Enter your registered email and we’ll send a secure link to reset your password.
        </p>

        {/* <div className="grid grid-cols-3 gap-10 max-w-md">
          <div>
            <h3 className="text-4xl font-display font-bold">1.2k+</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Active Users</p>
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold">850+</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Communities</p>
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold">99.9%</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Uptime</p>
          </div>
        </div> */}
      </motion.div>

      {/* Right Form */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="lg:w-1/2 flex items-center justify-center p-16 bg-background/70 backdrop-blur-sm"
      >
        <div className="w-full max-w-md bg-card rounded-3xl p-12 shadow-2xl relative">

          <div className="flex flex-col items-center gap-6">
            <StatusIcon />
            <h2 className="text-4xl font-display font-bold mb-2 text-center">Forgot Password</h2>
            <p className="text-center text-muted-foreground mb-6">{message}</p>

            <form className="space-y-8 w-full" onSubmit={handleSubmit} autoComplete="off">

              {/* Email input */}
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-primary opacity-50 blur-lg animate-gradient-x"></div>
                <div className="relative z-10">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                    className="peer w-full rounded-2xl bg-card border border-border pl-12 pr-4 py-4 text-lg text-foreground placeholder-transparent focus:border-primary focus:ring-2 focus:ring-primary outline-none transition shadow-sm focus:shadow-primary/50"
                  />
                  <label
                    className={`absolute left-12 cursor-text transition-all
                      ${email ? "top-1 text-sm text-primary" : "top-4.5 text-lg text-muted-foreground"}
                      peer-focus:top-1 peer-focus:text-sm peer-focus:text-primary`}
                  >
                    Email
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full relative rounded-2xl py-4 text-xl font-semibold text-white
                  overflow-hidden
                  bg-gradient-to-r from-primary to-blue-500
                  shadow-lg shadow-primary/50
                  before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-primary before:opacity-0 before:animate-gradient-x before:duration-5000 before:transition-all
                  hover:before:opacity-60 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                {status === "loading" ? "Sending link..." : "Send Reset Link"}
              </button>

            </form>

            <p className="mt-8 text-center text-muted-foreground text-sm">
              Remember your password? <a href="/#/auth/login" className="text-primary hover:underline">Log in</a>
            </p>

            <div className="mt-12 flex justify-center gap-6">
              <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] text-sm mb-6">
                <Shield size={20} /> Secure
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] text-sm mb-6">
                <Users size={20} /> Fast Access
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
