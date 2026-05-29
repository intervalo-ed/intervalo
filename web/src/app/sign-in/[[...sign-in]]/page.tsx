import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[#131324] px-5 py-12"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <SignIn
        forceRedirectUrl="/onboarding/complete"
        signUpForceRedirectUrl="/onboarding/complete"
        appearance={{
          variables: {
            colorPrimary: "#7E80F7",
            colorBackground: "#1E1E34",
            colorText: "#F6F8FC",
            colorTextSecondary: "#A4B3C6",
            colorInputBackground: "#2A2A4A",
            colorInputText: "#F6F8FC",
            colorNeutral: "#F6F8FC",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-sans)",
          },
          elements: {
            rootBox: "w-full max-w-[400px]",
            cardBox:
              "border border-[#38385A] shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
            headerTitle: "font-heading",
            headerSubtitle: "hidden",
            footer: "bg-[#1A1A2A]",
            footerAction: {
              display: "none",
            },
            formButtonPrimary:
              "font-mono uppercase tracking-[0.1em] text-[#131324] hover:bg-[#9698FA]",
          },
        }}
      />
    </main>
  )
}
