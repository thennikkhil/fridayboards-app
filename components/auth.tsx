"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Icon, Logo, type Page } from "./ui-kit"

export function Auth({ go }: { go: (page: Page) => void }) {
  const router = useRouter()
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const next = () => new URLSearchParams(location.search).get("next") || "/dashboard"
  const submit = async () => {
    if (busy) return
    setBusy(true)
    const res = signup
      ? await authClient.signUp.email({ name: name || email.split("@")[0], email, password })
      : await authClient.signIn.email({ email, password })
    setBusy(false)
    if (res.error) return alert(res.error.message || "Something went wrong")
    router.push(next())
    router.refresh()
  }
  const google = async () => {
    const res = await authClient.signIn.social({ provider: "google", callbackURL: next() })
    if (res?.error) alert("Google sign-in isn't configured yet")
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
            <i />
            <i />
            <i />
            <i />
            <b />
          </div>
          <h2>
            Good ideas
            <br />
            need a place
            <br />
            <em>to hang out.</em>
          </h2>
          <p>
            Plan projects, collect inspiration, and make sense of class
            notes—all on one infinite canvas.
          </p>
        </div>
        <div className="auth-squiggle">∿</div>
        <div className="student-card">
          <span className="av a2">A</span>
          <div>
            <b>“Finally, a tool my brain likes.”</b>
            <small>— Aria, design student</small>
          </div>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-logo">
            <Logo />
          </div>
          <span className="kicker">
            {signup ? "WELCOME TO THE CLUB" : "GOOD TO SEE YOU"}
          </span>
          <h1>{signup ? "Create your cozy corner." : "Welcome back."}</h1>
          <p>
            {signup
              ? "Your next big idea is one tiny form away."
              : "Your boards missed you. Let’s make something good."}
          </p>
          <button className="google-btn" onClick={google}>
            <span>G</span> Continue with Google
          </button>
          <div className="or">
            <span />
            or use email
            <span />
          </div>
          {signup && (
            <label>
              Your name
              <input placeholder="Maya Chen" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label>
            Email address
            <input type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password <a href="#forgot">{!signup && "Forgot password?"}</a>
            <input type="password" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </label>
          <button
            className="ink-btn auth-submit"
            onClick={submit}
          >
            {signup ? "Make my account" : "Enter my workspace"}{" "}
            <Icon name="arrow" size={18} />
          </button>
          <p className="switch-auth">
            {signup ? "Already have a spot?" : "New around here?"}{" "}
            <button onClick={() => setSignup(!signup)}>
              {signup ? "Log in" : "Create a free account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

