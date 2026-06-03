(() => {
  const PASSWORD = "cholosimeone";
  const AUTH_KEY = "ngd3_review_gate_ok";

  const isAuthed = () => localStorage.getItem(AUTH_KEY) === "1";

  const params = new URLSearchParams(window.location.search);
  if (params.get("logout") === "1") {
    localStorage.removeItem(AUTH_KEY);
  }

  if (isAuthed()) return;

  const styles = `
    .review-gate-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 1rem;
      background:
        radial-gradient(circle at 10% 10%, rgba(255, 212, 0, 0.08), transparent 35%),
        radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 40%),
        rgba(8, 8, 8, 0.96);
      backdrop-filter: blur(6px);
    }

    .review-gate-card {
      width: min(28rem, 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background: rgba(20, 20, 20, 0.95);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
      color: #f2f2f2;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    .review-gate-title {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .review-gate-copy {
      margin: 0 0 1rem;
      color: #bdbdbd;
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .review-gate-form {
      display: grid;
      gap: 0.75rem;
    }

    .review-gate-input {
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
      padding: 0.7rem 0.8rem;
      outline: none;
      font-size: 0.95rem;
    }

    .review-gate-input:focus {
      border-color: rgba(255, 212, 0, 0.55);
      box-shadow: 0 0 0 2px rgba(255, 212, 0, 0.2);
    }

    .review-gate-btn {
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 0.5rem;
      background: rgba(255, 212, 0, 0.9);
      color: #121212;
      padding: 0.65rem 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, filter 0.15s ease;
    }

    .review-gate-btn:hover {
      filter: brightness(1.05);
    }

    .review-gate-btn:active {
      transform: translateY(1px);
    }

    .review-gate-error {
      min-height: 1rem;
      font-size: 0.8rem;
      color: #fca5a5;
      margin: 0;
    }
  `;

  const mount = () => {
    const styleTag = document.createElement("style");
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);

    const overlay = document.createElement("div");
    overlay.className = "review-gate-overlay";
    overlay.innerHTML = `
      <div class="review-gate-card" role="dialog" aria-modal="true" aria-labelledby="review-gate-title">
        <h1 id="review-gate-title" class="review-gate-title">Review Access</h1>
        <p class="review-gate-copy">This preview is password protected while in review mode.</p>
        <form class="review-gate-form" autocomplete="off">
          <input
            class="review-gate-input"
            type="password"
            name="reviewPassword"
            placeholder="Enter access password"
            aria-label="Access password"
            required
          />
          <button type="submit" class="review-gate-btn">Enter Preview</button>
          <p class="review-gate-error" aria-live="polite"></p>
        </form>
      </div>
    `;

    const form = overlay.querySelector(".review-gate-form");
    const input = overlay.querySelector(".review-gate-input");
    const error = overlay.querySelector(".review-gate-error");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = (input.value || "").trim();
      if (value === PASSWORD) {
        localStorage.setItem(AUTH_KEY, "1");
        overlay.remove();
        return;
      }
      error.textContent = "Wrong password. Try again.";
      input.select();
    });

    document.body.appendChild(overlay);
    input.focus();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
