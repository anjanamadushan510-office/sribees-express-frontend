"use client";

import { LoginForm } from "@/components/forms/login-form";
import type { GuardType } from "@/types/auth";

interface LoginPageViewProps {
  guard?: GuardType;
  redirectTo?: string;
}

export function LoginPageView({
  guard = "staff",
  redirectTo = "/admin/dashboard",
}: LoginPageViewProps) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background overflow-hidden">
      {/* LEFT SIDE: Brand & Decorative Banner with Rounded Right Edge */}
      <div className="relative flex min-h-[360px] lg:min-h-screen w-full lg:w-[48%] flex-col items-center justify-center bg-gradient-to-br from-[#d6296b] via-[#c41c5c] to-[#7a0935] p-8 lg:p-12 text-white shrink-0 z-10 rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[180px] xl:rounded-r-[240px] shadow-2xl">
        
        {/* Background ambient lighting effects */}
        <div className="absolute top-0 left-0 size-full overflow-hidden rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[180px] xl:rounded-r-[240px] pointer-events-none">
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-black/25 blur-3xl" />
          
          {/* Decorative background subtle flowing wave paths */}
          <svg
            className="absolute inset-0 size-full opacity-15"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 800"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M -100,200 C 150,400 350,100 600,300 C 850,500 950,200 1100,400 L 1100,900 L -100,900 Z"
              fill="url(#waveGrad)"
            />
            <path
              d="M -100,380 C 200,180 400,520 700,280 C 1000,40 900,480 1100,620 L 1100,900 L -100,900 Z"
              fill="url(#waveGrad)"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Outer translucent white highlight curve border effect */}
        <div className="absolute inset-0 border-r-4 border-white/20 rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[180px] xl:rounded-r-[240px] pointer-events-none" />

        {/* Center Content: Logo & Tagline */}
        <div className="relative z-20 flex flex-col items-center text-center max-w-md my-auto">
          {/* Rider / Express Logo Container */}
          <div className="mb-6 flex size-28 lg:size-36 items-center justify-center rounded-3xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/25 shadow-2xl transition-transform hover:scale-105 duration-300">
            <img
              src="/logo.png"
              alt="SRIBEES Express"
              className="size-full object-contain brightness-0 invert drop-shadow-md"
            />
          </div>

          <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            SRIBEES<span className="font-light opacity-95"> Express</span>
          </h1>

          <p className="mt-3 text-base lg:text-xl font-medium text-rose-100/90 tracking-wide">
            Order Management &amp; Courier Portal
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form Area */}
      <div className="relative flex flex-1 items-center justify-center bg-background p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Log In
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please login to your account to continue
            </p>
          </div>

          {/* Form Component */}
          <LoginForm guard={guard} redirectTo={redirectTo} />

          {/* Contact / Help Sub-text */}
          <div className="pt-4 text-center text-xs text-muted-foreground">
            Need help logging in?{" "}
            <span className="font-semibold text-primary">Contact System Administrator</span>
          </div>

        </div>
      </div>
    </div>
  );
}
