"use client"
import { Icon, Logo, type Page } from "./ui-kit"

export function Landing({ go }: { go: (page: Page) => void }) {
  return (
    <div className="landing">
      <nav className="topnav">
        <Logo />
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#students">For students</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-actions">
          <button className="text-btn" onClick={() => go("auth")}>
            Log in
          </button>
          <button className="ink-btn small" onClick={() => go("auth")}>
            Start creating <Icon name="arrow" size={16} />
          </button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> Made for curious minds
            </div>
            <h1>
              Think it.
              <br />
              <em>Make it visible.</em>
            </h1>
            <p>
              The cozy collaborative canvas for notes, ideas, study sessions,
              and beautifully organized chaos.
            </p>
            <div className="hero-actions">
              <button className="coral-btn" onClick={() => go("dashboard")}>
                Create your first board <Icon name="arrow" />
              </button>
              <button className="watch-btn" onClick={() => go("board")}>
                <span>
                  <Icon name="play" size={17} />
                </span>{" "}
                Watch how it works
              </button>
            </div>
            <div className="friend-proof">
              <div className="avatar-stack">
                <i className="av a1">M</i>
                <i className="av a2">J</i>
                <i className="av a3">A</i>
                <i className="av a4">+2k</i>
              </div>
              <span>
                Loved by students who
                <br />
                think outside the lines.
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="A playful preview of a collaborative moodboard"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="paper board-preview">
              <div className="preview-toolbar">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="tape" />
              <div className="yellow-note">
                <b>Big idea!</b>
                <br />
                <span>
                  what if studying
                  <br />
                  felt like playing?
                </span>
                <div className="note-smile">⌣</div>
              </div>
              <div className="mini-card">
                <div className="sunset" />
                <b>Visual research</b>
                <small>12 references</small>
              </div>
              <div className="scribble">
                ideas
                <br />
                <i>everywhere</i>
              </div>
              <svg className="doodle-arrow" viewBox="0 0 120 70">
                <path d="M4 20c30-20 70-10 92 25M84 37l13 9-4-15" />
              </svg>
            </div>
            <div className="floating-comment">
              this feels right! <b>♡</b>
            </div>
            <div className="sticker flower">
              <i />
              <i />
              <i />
              <i />
              <b />
            </div>
            <div className="sticker face">•‿•</div>
          </div>
        </section>

        <section className="ticker">
          <span>Brainstorm together</span>
          <b>✦</b>
          <span>Study visually</span>
          <b>✦</b>
          <span>Make ideas move</span>
          <b>✦</b>
          <span>Stay in your flow</span>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span>YOUR BRAIN, UNBOXED</span>
            <h2>
              Everything you need.
              <br />
              <em>Nothing you don't.</em>
            </h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card lavender">
              <div className="feature-icon">
                <Icon name="spark" />
              </div>
              <h3>A canvas that keeps up</h3>
              <p>
                Sketch, type, paste, link. Follow every thought without breaking
                your flow.
              </p>
              <div className="feature-art flow-art">
                <span>research</span>
                <span>idea!</span>
                <span>final-ish</span>
                <svg viewBox="0 0 220 95">
                  <path d="M30 60c45-70 80 45 145-20" />
                </svg>
              </div>
            </article>
            <article className="feature-card mint">
              <div className="feature-icon">
                <Icon name="share" />
              </div>
              <h3>Better, together</h3>
              <p>
                Invite your project crew. See cursors, leave notes, and build in
                real time.
              </p>
              <div className="feature-art people-art">
                <i>M</i>
                <i>J</i>
                <i>A</i>
                <div>
                  3 minds
                  <br />
                  <b>one board</b>
                </div>
              </div>
            </article>
            <article className="feature-card peach">
              <div className="feature-icon">
                <Icon name="music" />
              </div>
              <h3>Set the mood</h3>
              <p>
                Embed videos, play focus beats, and make study time feel less
                like a chore.
              </p>
              <div className="feature-art player">
                <div className="album">♫</div>
                <div>
                  <b>soft focus radio</b>
                  <small>study club · 2:31</small>
                  <div className="soundbars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <button>
                  <Icon name="play" size={16} />
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Make space for good ideas.</span>
        <button onClick={() => go("auth")}>
          Join the club <Icon name="arrow" size={16} />
        </button>
      </footer>
    </div>
  )
}

