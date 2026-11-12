"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Icon, Logo, type Page } from "./ui-kit"

/** Auto-dismissing error banner that disappears after 3 seconds */
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div
      role="alert"
      style={{
        background: "#fee2e2",
        border: "1.5px solid #fca5a5",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        color: "#b91c1c",
        display: "flex",
        alignItems: "center",
        gap: 8,
        animation: "fadeIn .2s ease",
      }}
    >
      <span style={{ fontSize: 16 }}>⚠</span>
      {message}
    </div>
  )
}

/** Inline field error shown below an input */
function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <span id={id} role="alert" style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "block" }}>
      {message}
    </span>
  )
}

function validate(signup: boolean, email: string, password: string, name: string) {
  const errs: { name?: string; email?: string; password?: string } = {}
  if (signup && !name.trim()) errs.name = "Please enter your name."
  if (!email.trim()) errs.email = "Email is required."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "That doesn't look like a valid email."
  if (!password) errs.password = "Password is required."
  else if (signup && password.length < 8) errs.password = "Password must be at least 8 characters."
  return errs
}

function getSafeNextPath() {
  const fallback = "/dashboard"
  const candidate = new URLSearchParams(window.location.search).get("next")
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback
  }

  try {
    const target = new URL(candidate, window.location.origin)
    if (target.origin !== window.location.origin || target.username || target.password) {
      return fallback
    }
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}

export function Auth({ go }: { go: (page: Page) => void }) {
  const router = useRouter()
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [banner, setBanner] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  const next = getSafeNextPath

  const submit = async () => {
    if (busy || navigating) return
    const errs = validate(signup, email, password, name)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setBusy(true)
    try {
      const res = signup
        ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
        : await authClient.signIn.email({ email, password })
      if (res.error) {
        const message = res.error.message ?? ""
        if (/invalid.*(credential|password|email)|incorrect.*(password|email)|password.*invalid/i.test(message)) {
          setFieldErrors((current) => ({ ...current, password: "Email or password is incorrect." }))
        } else if (signup && /already|exists|duplicate/i.test(message)) {
          setFieldErrors((current) => ({ ...current, email: "An account with this email already exists." }))
        } else if (/email/i.test(message) && /invalid|format/i.test(message)) {
          setFieldErrors((current) => ({ ...current, email: "Enter a valid email address." }))
        } else {
          setBanner("Service unavailable. Please try again.")
        }
        return
      }
      setNavigating(true)
      router.push(next())
      router.refresh()
    } catch {
      setBanner("Service unavailable. Please check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    if (busy || googleBusy || navigating) return
    setGoogleBusy(true)
    try {
      const res = await authClient.signIn.social({ provider: "google", callbackURL: next() })
      if (res?.error) {
        setBanner("Google sign-in is unavailable. Please try again or use email.")
        setGoogleBusy(false)
      }
    } catch {
      setBanner("Google sign-in is unavailable. Please try again.")
      setGoogleBusy(false)
    }
  }

  // Reset field errors when user starts typing
  const field = (setter: (v: string) => void, key: keyof typeof fieldErrors) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    if (fieldErrors[key]) setFieldErrors((f) => ({ ...f, [key]: undefined }))
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => go("landing")}>
        <Icon name="arrow" size={17} /> Back home
      </button>
      <div className="auth-art">
        <Logo light />
        <div className="auth-quote">
          <div className="big-flower sticker flower">
            <i /><i /><i /><i /><b />
          </div>
          <h2>Good ideas<br />need a place<br /><em>to hang out.</em></h2>
          <p>Plan projects, collect inspiration, and make sense of class notes—all on one infinite canvas.</p>
        </div>
        <div className="auth-squiggle">∿</div>
        <div className="student-card">
          <span className="av a2">A</span>
          <div>
            <b>"Finally, a tool my brain likes."</b>
            <small>— Aria, design student</small>
          </div>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-logo"><Logo /></div>
          <span className="kicker">{signup ? "WELCOME TO THE CLUB" : "GOOD TO SEE YOU"}</span>
          <h1>{signup ? "Create your cozy corner." : "Welcome back."}</h1>
          <p>{signup ? "Your next big idea is one tiny form away." : "Your boards missed you. Let's make something good."}</p>

          {/* Auto-dismiss error banner */}
          {banner && <ErrorBanner message={banner} onDismiss={() => setBanner("")} />}

          <button className="google-btn" onClick={google} disabled={busy || googleBusy || navigating}>
            {googleBusy ? "Connecting to Google…" : <><span>G</span> Continue with Google</>}
          </button>
          <div className="or"><span />or use email<span /></div>

          {signup && (
            <label>
              Your name
              <input
                placeholder="Maya Chen"
                value={name}
                onChange={field(setName, "name")}
                style={fieldErrors.name ? { borderColor: "#dc2626" } : {}}
              />
              <FieldError message={fieldErrors.name} />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
              placeholder="you@university.edu"
              value={email}
              onChange={field(setEmail, "email")}
              style={fieldErrors.email ? { borderColor: "#dc2626" } : {}}
            />
            <FieldError id="auth-email-error" message={fieldErrors.email} />
          </label>
          <label>
            Password{" "}
            {!signup && (
              <button
                type="button"
                className="forgot-password"
                onClick={() => setBanner("Password reset is not available yet. Please contact your workspace administrator.")}
              >
                Forgot password?
              </button>
            )}
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "auth-password-error" : undefined}
              placeholder="••••••••••"
              value={password}
              onChange={field(setPassword, "password")}
              style={fieldErrors.password ? { borderColor: "#dc2626" } : {}}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <FieldError id="auth-password-error" message={fieldErrors.password} />
          </label>

          <button
            className="ink-btn auth-submit"
            onClick={submit}
            disabled={busy || googleBusy || navigating}
            style={{ opacity: busy || googleBusy || navigating ? 0.7 : 1, cursor: busy || googleBusy || navigating ? "not-allowed" : "pointer" }}
          >
            {navigating
              ? "Opening your workspace…"
              : busy || googleBusy
              ? (signup ? "Creating account…" : "Signing in…")
              : (signup ? "Make my account" : "Enter my workspace")}
            {!busy && !navigating && <Icon name="arrow" size={18} />}
            {(busy || navigating) && (
              <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", marginLeft: 6 }} />
            )}
          </button>
          <p className="switch-auth">
            {signup ? "Already have a spot?" : "New around here?"}{" "}
            <button onClick={() => { setSignup(!signup); setFieldErrors({}); setBanner("") }}>
              {signup ? "Log in" : "Create a free account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
