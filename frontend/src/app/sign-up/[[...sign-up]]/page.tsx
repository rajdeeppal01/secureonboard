import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SecureOnboard</p>
            <p className="text-slate-400 text-xs mt-0.5">Identity Lifecycle Automation</p>
          </div>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#3b82f6",
              colorBackground: "#0f172a",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-slate-900 border border-slate-800 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
              dividerLine: "bg-slate-700",
              dividerText: "text-slate-500",
              formFieldInput: "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500",
              footerActionLink: "text-blue-400 hover:text-blue-300",
            },
          }}
        />
      </div>
    </div>
  );
}
