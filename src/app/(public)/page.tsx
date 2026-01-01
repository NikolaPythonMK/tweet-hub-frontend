import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Signal over noise</p>
          <h1 className={styles.title}>
            A quieter feed for real thoughts, built for momentum.
          </h1>
          <p className={styles.lede}>
            Tweet Hub keeps the essentials: fast posting, crisp threads, and
            intentional visibility. Start small, stay sharp, and keep your
            timeline centered.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.primary}>
              Start a profile
            </Link>
            <Link href="/feed" className={styles.secondary}>
              Explore feed
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div>
              <span className={styles.statValue}>15s</span>
              <span className={styles.statLabel}>to post</span>
            </div>
            <div>
              <span className={styles.statValue}>3x</span>
              <span className={styles.statLabel}>faster replies</span>
            </div>
            <div>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>chronological</span>
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardDot} />
            <span className={styles.cardTitle}>Live thread</span>
            <span className={styles.cardBadge}>public</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.cardPost}>
              <div className={styles.avatar}>NH</div>
              <div>
                <p className={styles.cardName}>@nikola</p>
                <p className={styles.cardText}>
                  Pushing the feed to feel lighter. Notes go out faster when the
                  UI stays quiet.
                </p>
              </div>
            </div>
            <div className={styles.cardPost}>
              <div className={styles.avatar}>AJ</div>
              <div>
                <p className={styles.cardName}>@ava</p>
                <p className={styles.cardText}>
                  Loving the way threads stay readable even at 3am.
                </p>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span>likes 12</span>
              <span>replies 3</span>
              <span>reposts 1</span>
            </div>
          </div>
        </div>
      </main>

      <section className={styles.features}>
        <div className={styles.feature}>
          <h3>Intentional visibility</h3>
          <p>Choose who can reply and how far your posts travel.</p>
        </div>
        <div className={styles.feature}>
          <h3>High-velocity feeds</h3>
          <p>Cursor pagination keeps infinite scrolls smooth and fast.</p>
        </div>
        <div className={styles.feature}>
          <h3>Bookmarks that matter</h3>
          <p>Save threads into a private library for later.</p>
        </div>
        <div className={styles.feature}>
          <h3>Signal-first design</h3>
          <p>Clean typography, bold clarity, no visual clutter.</p>
        </div>
      </section>

      <section className={styles.steps}>
        <div>
          <h2>Build your cadence</h2>
          <p>
            Your timeline is a rhythm. Draft, reply, repost, and let the moment
            stack naturally.
          </p>
        </div>
        <ol className={styles.stepList}>
          <li>
            <span>01</span>
            <div>
              <h4>Create your account</h4>
              <p>Pick a handle and set the tone for your feed.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h4>Drop a short post</h4>
              <p>Text-first or add a single visual to anchor the moment.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h4>Keep threads tight</h4>
              <p>Reply rules let you keep the conversation focused.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.cta}>
        <div>
          <h2>Ready to shape your feed?</h2>
          <p>Start with a profile and a single post. Everything else follows.</p>
        </div>
        <Link href="/register" className={styles.ctaButton}>
          Create your account
        </Link>
      </section>
    </div>
  );
}
