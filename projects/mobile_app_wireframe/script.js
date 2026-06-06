import { people as originalPeople } from "./people.js";
import legislators from "./openstates-w-legislators/w_state_legislators.js";
let people = [...originalPeople];
let legislatorsLoaded = false;
let loadedLegislatorNames = new Set();
// Track the currently viewed person in the bio overlay
let currentBioPersonId = null;
let currentLoginMode = null; // track active login mode

// Stable favorites persistence using composite keys (name + role)
const FAVORITES_KEY = "favoritePersonKeys";
let favoritePersonKeys = [];
function getPersonKey(person) {
  return `${(person.name || "").trim()}||${(person.role || "").trim()}`;
}

function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Backward compatibility: if it looks like an array of numbers, convert to keys
      if (parsed.length && typeof parsed[0] === "number") {
        favoritePersonKeys = parsed
          .map((idx) => (people[idx] ? getPersonKey(people[idx]) : null))
          .filter(Boolean);
        saveFavoritesToStorage();
      } else {
        favoritePersonKeys = parsed.filter((v) => typeof v === "string");
      }
    }
  } catch (_) {
    favoritePersonKeys = [];
  }
}
function saveFavoritesToStorage() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritePersonKeys));
  } catch (_) {}
}
function isInFavorites(personId) {
  if (personId == null || isNaN(personId)) return false;
  const person = people[personId];
  if (!person) return false;
  return favoritePersonKeys.includes(getPersonKey(person));
}
function removePersonFromFavorites(personId) {
  if (personId == null || isNaN(personId)) return;
  const person = people[personId];
  if (!person) return;
  const key = getPersonKey(person);
  if (!favoritePersonKeys.includes(key)) return;
  favoritePersonKeys = favoritePersonKeys.filter((k) => k !== key);
  saveFavoritesToStorage();
  const container = getFavoritesCarouselContainer();
  if (container) {
    const card = container.querySelector(
      `.favorite-card[data-person-id="${personId}"]`
    );
    if (card) card.remove();
  }
  if (currentBioPersonId === personId) updateFavoriteStarState();
}
function updateFavoriteStarState() {
  const btn = document.getElementById("bio-favorite-btn");
  if (!btn) return;
  const active =
    currentBioPersonId != null && isInFavorites(currentBioPersonId);
  btn.classList.toggle("active", !!active);
  btn.setAttribute("aria-pressed", active ? "true" : "false");
  const path = btn.querySelector("path");
  if (path) path.setAttribute("fill", active ? "currentColor" : "none");
}
function addPersonToFavorites(personId) {
  if (personId == null || isNaN(personId)) return;
  const person = people[personId];
  if (!person) return;
  const key = getPersonKey(person);
  const container = getFavoritesCarouselContainer();
  if (!container) return;

  const already = favoritePersonKeys.includes(key);
  // If already favorite and card exists, just ensure star state
  if (
    already &&
    container.querySelector(`.favorite-card[data-person-id="${personId}"]`)
  ) {
    updateFavoriteStarState();
    return;
  }
  // Create card
  const card = createFavoriteCard(person, personId);
  container.appendChild(card);
  const img = card.querySelector(".favorite-avatar");
  if (img) {
    if (person.type === "Agencies") {
      img.src = "img/agency-icon.svg";
      img.onerror = null;
    } else if (person.type === "Committees") {
      img.src = "img/congress-committee-icon.svg";
      img.onerror = null;
    } else {
      setImgWithFallback(
        img,
        person.img || getHeadshotUrl(personId),
        getFallbackHeadshotUrl(personId),
        person.name || "Avatar"
      );
    }
  }
  card.addEventListener("click", function () {
    currentBioPersonId = personId;
    document.getElementById("bioNameWithDistrict").textContent =
      person.nameWithDistrict || person.name;
    document.getElementById("bioServiceDetails").innerHTML =
      `<p>${person.role || ""}</p>` +
      `<p>Service Start: ${person.serviceStart || "N/A"}</p>` +
      `<p>Next Election: ${person.nextElection || "N/A"}</p>`;
    const imgDiv = document.getElementById("bioProfileImage");
    if (imgDiv) {
      imgDiv.style.backgroundImage = person.img ? `url('${person.img}')` : "";
      imgDiv.style.backgroundSize = "cover";
      imgDiv.style.backgroundPosition = "center";
      imgDiv.style.width = "64px";
      imgDiv.style.height = "64px";
      imgDiv.style.borderRadius = "50%";
      imgDiv.style.border = "2px solid #0073ba";
    }
    const partyToken = document.getElementById("bioPartyToken");
    if (partyToken) {
      partyToken.textContent = person.party || "";
      partyToken.style.background = person.partyColor || "#0073ba";
      partyToken.style.color = "#fff";
    }
    updateFavoriteStarState();
    toggleBioOverlay(true);
  });
  if (!already) {
    favoritePersonKeys.push(key);
    saveFavoritesToStorage();
  }
  updateFavoriteStarState();
}
function renderFavoritesFromStorage() {
  const container = getFavoritesCarouselContainer();
  if (!container) return;
  favoritePersonKeys.forEach((key) => {
    const idx = people.findIndex((p) => getPersonKey(p) === key);
    if (idx >= 0) addPersonToFavorites(idx);
  });
}

// Wikimedia Commons: Official portraits of the 118th Congress
const WIKI_CATEGORY =
  "Category:Official portraits of members of the 118th United States Congress";
let WIKI_HEADSHOTS = [];
async function loadWikimediaHeadshots() {
  if (WIKI_HEADSHOTS.length) return WIKI_HEADSHOTS;
  const params = new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: WIKI_CATEGORY,
    gcmtype: "file",
    gcmlimit: "500",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "256",
    format: "json",
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const list = Object.values(pages)
      .filter((p) => p.imageinfo && p.imageinfo[0])
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .map((p) => p.imageinfo[0].thumburl || p.imageinfo[0].url)
      .filter(Boolean);
    if (list.length) WIKI_HEADSHOTS = list;
  } catch (_) {
    // swallow; fallbacks will be used
  }
  return WIKI_HEADSHOTS;
}
function pickWikiHeadshot(seed) {
  return WIKI_HEADSHOTS.length
    ? WIKI_HEADSHOTS[seed % WIKI_HEADSHOTS.length]
    : null;
}
function getHeadshotUrl(seed) {
  // Prefer Wikimedia; fall back to Unsplash-based generator
  return pickWikiHeadshot(seed) || getRandomHeadshotUrl(seed);
}

// Seeded Unsplash headshots for people and directories
function getRandomHeadshotUrl(seed) {
  const base = "https://source.unsplash.com/featured/256x256/";
  const q = `politician,official,congress,capitol,suit,headshot,face,upper body`;
  return `${base}?${encodeURI(q)}&sig=${seed}`;
}

// Fallback chain utilities to avoid 503s
function getFallbackHeadshotUrl(seed) {
  return `https://picsum.photos/seed/headshot-${seed}/256/256`;
}
function svgPlaceholder(w = 256, h = 256, text = "Image") {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        fill='#6b7280' font-family='system-ui,-apple-system,Segoe UI,Roboto' font-size='14'>${text}</text>
    </svg>`
  );
  return `data:image/svg+xml,${svg}`;
}
function setImgWithFallback(img, primary, fallback, label) {
  img.src = primary;
  img.onerror = () => {
    img.onerror = () => {
      img.onerror = null;
      img.src = svgPlaceholder(
        img.width || 256,
        img.height || 256,
        label || "Image"
      );
    };
    img.src = fallback;
  };
}

// Helper to detect if an img is a custom/manual dataset image
function isManualImg(img) {
  if (!img) return false;
  // Consider manual if it's not a known fallback, not Unsplash, not SVG, not Wikimedia
  if (
    img.startsWith("img/") ||
    img.startsWith("https://encrypted-tbn0.gstatic.com//") ||
    img.startsWith("https://upload.wikimedia.org/")
  )
    return true;
  // Add more rules if you have other manual patterns
  return false;
}

// Replace previous random assignment with a stable seeded one
people.forEach((person, i) => {
  if (person.type === "Committees") {
    person.img = "img/congress-committee-icon.svg";
  } else if (person.type === "Agencies") {
    person.img = "img/agency-icon.svg";
  } else if (!person.img) {
    // Only assign if not already set in dataset
    person.img = getHeadshotUrl(i);
  }
});

// Apply headshots to "Directories" favorite cards if they exist
function applyHeadshotsToFavorites() {
  document
    .querySelectorAll(".favorite-card .favorite-avatar")
    .forEach((img, i) => {
      // Try to get the person object by matching the favorite card's name and role
      const card = img.closest(".favorite-card");
      const name = card?.querySelector(".favorite-name")?.textContent?.trim();
      const role = card?.querySelector(".favorite-role")?.textContent?.trim();
      const person = people.find((p) => p.name === name && p.role === role);
      if (person && person.type === "Agencies") {
        img.src = "img/agency-icon.svg";
        img.onerror = null;
      } else if (person && person.type === "Committees") {
        img.src = "img/congress-committee-icon.svg";
        img.onerror = null;
      } else {
        const seed = 1000 + i;
        setImgWithFallback(
          img,
          getHeadshotUrl(seed),
          getFallbackHeadshotUrl(seed),
          "Avatar"
        );
      }
    });
}

// Apply headshots to "Favorites" carousel cards
function applyHeadshotsToFavoritesCarousel() {
  document
    .querySelectorAll(".favorite-card .favorite-avatar")
    .forEach((img, i) => {
      const card = img.closest(".favorite-card");
      const name = card?.querySelector(".favorite-name")?.textContent?.trim();
      const role = card?.querySelector(".favorite-role")?.textContent?.trim();
      const person = people.find((p) => p.name === name && p.role === role);
      if (person && person.type === "Agencies") {
        img.src = "img/agency-icon.svg";
        img.onerror = null;
      } else if (person && person.type === "Committees") {
        img.src = "img/congress-committee-icon.svg";
        img.onerror = null;
      } else {
        const seed = 1000 + i;
        setImgWithFallback(
          img,
          getHeadshotUrl(seed),
          getFallbackHeadshotUrl(seed),
          "Avatar"
        );
      }
      // Sync the dataset for bio overlay consistency
      img.closest(".favorite-card").dataset.imgUrl = img.currentSrc || img.src;
    });
}

// --- Favorites helpers ---
function getFavoritesCarouselContainer() {
  return document.querySelector(".side-overlay .carousel");
}
function createFavoriteCard(person, personId) {
  const card = document.createElement("div");
  card.className = "carousel-item favorite-card";
  card.setAttribute("data-person-id", String(personId));
  // Split name into first (all but last word) and last (last word)
  const nameParts = (person.name || "").trim().split(/\s+/);
  let firstName = person.name || "";
  let lastName = "";
  if (nameParts.length > 1) {
    lastName = nameParts.pop();
    firstName = nameParts.join(" ");
  }
  card.innerHTML = `
  <span class="favorite-role">${person.role || ""}</span>  
    <div class="favorite-info">
      <span class="favorite-name">
        <span class="favorite-first-name">${firstName}</span>
        ${lastName ? `<span class="favorite-last-name">${lastName}</span>` : ""}
      </span>
      <img src="" alt="${person.name}" class="favorite-avatar" />
    </div>
  `;
  return card;
}
function navigate(sectionId) {
  const sections = document.querySelectorAll(".wireframe-box");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  const activeSection = document.getElementById(`${sectionId}-content`);
  if (activeSection) {
    activeSection.style.display = "block";
  }

  const navButtons = document.querySelectorAll(".app-nav button");
  navButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const activeButton = document.getElementById(sectionId);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  // Trigger theme-color update after navigation
  if (window.updateThemeColorManually) {
    // Small delay to ensure DOM has updated
    requestAnimationFrame(() => {
      setTimeout(window.updateThemeColorManually, 50);
    });
  }
}

// Attach the function to the global window object
window.navigate = navigate;

// Ensure the app surface is visible (hide login/prototype, show app)
function ensureAppVisible() {
  const login = document.getElementById("login");
  if (login) login.style.display = "none";
  const proto = document.querySelector(".prototype-screen");
  if (proto) proto.style.display = "none";
  const appRoot = document.getElementById("app");
  if (appRoot) appRoot.style.display = "block";
}
window.ensureAppVisible = ensureAppVisible;

// --- Deep-link routing via URL hash ---
function handleHashNavigation() {
  const hash = (window.location.hash || "").toLowerCase();
  if (!hash) return;
  // Make sure the app UI is visible when using deep links
  try {
    ensureAppVisible();
  } catch (_) {}

  // NEW: tool deep-links e.g. #tool/meeting, #tool/directories
  const mTool = hash.match(/^#tool\/(.+)$/);
  if (mTool) {
    try {
      openTool(mTool[1]);
    } catch (_) {}
    return;
  }

  // Special case: pro tools should force pro theme and show tools grid
  if (hash === "#pro-tools") {
    try {
      setTheme("pro");
      // Persist session so subsequent loads stay in PRO mode
      localStorage.setItem("appMode", "pro");
      localStorage.setItem("appEntered", "true");
    } catch (_) {}
    navigate("tools");
    return;
  }
  // Generic section routing
  const m = hash.match(/^#(news|newsletter|foryou|tools)$/);
  if (m) {
    navigate(m[1]);
  }
}
window.handleHashNavigation = handleHashNavigation;
window.addEventListener("hashchange", handleHashNavigation);

// Wrapper to support legacy inline onclick="navigateToDirectories()"
function navigateToDirectories() {
  try {
    navigate("directories");
    if (typeof toggleSideOverlay === "function") {
      toggleSideOverlay(true); // ensure side overlay slides in
    } else {
      const side = document.getElementById("sideOverlay");
      if (side) side.classList.add("visible");
    }
  } catch (e) {
    console.warn("navigateToDirectories failed:", e);
  }
}
window.navigateToDirectories = navigateToDirectories;

// Track news card clicks for skip experience
let newsCardClickCount = 0;
let isSkipExperience = false;

function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  document.body.className = `theme-${themeName}`;

  const proUpsellSection = document.getElementById("pro-upsell-section");
  const toolsGrid = document.getElementById("tools-grid");

  if (themeName === "pro") {
    // PRO USERS: Hide upsell, show tools
    if (proUpsellSection) proUpsellSection.style.display = "none";
    if (toolsGrid) {
      toolsGrid.style.display = "grid";
      toolsGrid.className = "tools-grid"; // Remove any old classes
    }
    addNewsCardPills();
  } else {
    // NON-PRO USERS: Show upsell, hide tools
    if (proUpsellSection) proUpsellSection.style.display = "block";
    if (toolsGrid) {
      toolsGrid.style.display = "none";
    }
    document.querySelectorAll(".news-card-tag").forEach((tag) => {
      tag.style.display = "none";
    });
  }
}

function showApp(loginType, person) {
  currentLoginMode = loginType; // record mode for skip overlay logic
  const welcomeMessage = document.getElementById("welcome-message");
  const userInitials = document.getElementById("user-initials");
  const forYouContent = document.getElementById("foryou-content");
  const newsContent = document.getElementById("news-content");
  const appRoot = document.getElementById("app");
  const loginScreenEl = document.getElementById("login");
  if (loginScreenEl) loginScreenEl.style.display = "none";

  if (loginType === "pro") {
    setTheme("pro");
    if (userInitials) {
      userInitials.textContent = "OS";
      userInitials.style.display = "flex";
      userInitials.style.backgroundImage = "";
    }
    if (welcomeMessage) welcomeMessage.textContent = "Welcome back, Pro user!";
    if (appRoot) appRoot.style.display = "block";
    addNewsCardPills();
    // Inject news toggle if not present
    if (newsContent && !newsContent.querySelector(".news-toggle")) {
      const toggle = document.createElement("div");
      toggle.className = "news-toggle";
      toggle.innerHTML = `
        <button id="top-news-btn" class="news-toggle-btn active">Top News</button>
        <button id="latest-news-btn" class="news-toggle-btn">My News</button>
      `;
      newsContent.insertBefore(toggle, newsContent.firstChild);
      const topNewsBtn = toggle.querySelector("#top-news-btn");
      const latestNewsBtn = toggle.querySelector("#latest-news-btn");
      if (topNewsBtn && latestNewsBtn) {
        topNewsBtn.addEventListener("click", () => {
          topNewsBtn.classList.add("active");
          latestNewsBtn.classList.remove("active");
          document.getElementById("top-news-feed").style.display = "flex";
          document.getElementById("latest-news-feed").style.display = "none";
        });
        latestNewsBtn.addEventListener("click", () => {
          latestNewsBtn.classList.add("active");
          topNewsBtn.classList.remove("active");
          document.getElementById("top-news-feed").style.display = "none";
          document.getElementById("latest-news-feed").style.display = "flex";
        });
      }
    }
  } else if (loginType === "consumer") {
    setTheme("consumer");
    if (userInitials) {
      // Show initials for consumer accounts (previously hidden)
      userInitials.textContent = "OS"; // placeholder initials; replace with dynamic user data when available
      userInitials.style.display = "flex";
      userInitials.style.backgroundImage = "";
    }
    if (welcomeMessage) {
      welcomeMessage.innerHTML =
        'Sign in or <button id="create-account-link">create an account</button> to get the most out of our app!';
    }
    if (appRoot) appRoot.style.display = "block";
    // Remove pro-only toggle if present
    if (newsContent) {
      const toggle = newsContent.querySelector(".news-toggle");
      if (toggle) toggle.remove();
    }
    const mainHeaderIcon = document.getElementById("main-header-icon");
    if (mainHeaderIcon) mainHeaderIcon.style.display = "none"; // hide icon for consumer mode now
  } else if (loginType === "skip") {
    setTheme("consumer");
    if (userInitials) {
      userInitials.textContent = "";
      userInitials.style.display = "none";
    }
    if (welcomeMessage) {
      welcomeMessage.innerHTML =
        'Sign in or <button id="create-account-link">create an account</button> to get the most out of our app!';
    }
    if (appRoot) appRoot.style.display = "block";
    if (newsContent) {
      const toggle = newsContent.querySelector(".news-toggle");
      if (toggle) toggle.remove();
    }
  }

  // Persist session so returning via back links restores state
  try {
    localStorage.setItem("appEntered", "true");
    localStorage.setItem("appMode", loginType === "pro" ? "pro" : "consumer");
  } catch (_) {}

  // CRITICAL: Update theme-color after app becomes visible and header is rendered
  // Multiple attempts ensure we catch the header after DOM updates and paint
  if (window.updateThemeColorManually) {
    requestAnimationFrame(() => {
      window.updateThemeColorManually();
      setTimeout(window.updateThemeColorManually, 100);
      setTimeout(window.updateThemeColorManually, 300);
      setTimeout(window.updateThemeColorManually, 500);
    });
  }

  // Defer notification prompt slightly for all login types except when still on login screen
  setTimeout(() => {
    const notificationOverlay = document.getElementById("notification-overlay");
    if (notificationOverlay && appRoot && appRoot.style.display !== "none") {
      notificationOverlay.style.display = "flex";
    }
  }, 600);

  // Populate bio info only if a person object passed
  if (person) {
    document.getElementById("bioMemberLabel").textContent =
      person.memberType || "MEMBER";
    document.getElementById("bioNameWithDistrict").textContent =
      person.nameWithDistrict || person.name;
    document.getElementById("bioServiceDetails").innerHTML =
      `<p>${
        person.serviceStart ? `Serving since ${person.serviceStart}` : ""
      }</p>` +
      `<p>${
        person.nextElection
          ? `Up for re-election in ${person.nextElection}`
          : ""
      }</p>`;
    const imgDiv = document.getElementById("bioProfileImage");
    if (imgDiv) {
      imgDiv.style.backgroundImage = person.img ? `url('${person.img}')` : "";
      imgDiv.style.backgroundSize = "cover";
      imgDiv.style.backgroundPosition = "center";
      imgDiv.style.width = "64px";
      imgDiv.style.height = "64px";
      imgDiv.style.borderRadius = "50%";
      imgDiv.style.border = "2px solid #0073ba";
    }
    const partyToken = document.getElementById("bioPartyToken");
    if (partyToken) {
      partyToken.textContent = person.party || "";
      partyToken.style.background = person.partyColor || "#0073ba";
      partyToken.style.color = "#fff";
      partyToken.style.position = "absolute";
      partyToken.style.bottom = "-10px";
      partyToken.style.left = "-10px";
      partyToken.style.width = "30px";
      partyToken.style.height = "30px";
      partyToken.style.borderRadius = "50%";
      partyToken.style.display = "flex";
      partyToken.style.alignItems = "center";
      partyToken.style.justifyContent = "center";
      partyToken.style.fontWeight = "bold";
      partyToken.style.fontSize = "16px";
    }
  }
}

// Attach click listeners to favorites carousel cards
function attachFavoritesClickHandlers() {
  document.querySelectorAll(".favorite-card").forEach((card) => {
    card.addEventListener("click", function () {
      const personId = parseInt(this.dataset.personId, 10);
      const person = people[personId];
      if (person) {
        currentBioPersonId = personId; // track current person for star state
        document.getElementById("bioNameWithDistrict").textContent =
          person.nameWithDistrict || person.name;
        document.getElementById("bioServiceDetails").innerHTML =
          `<p>${person.role}</p>` +
          `<p>Service Start: ${person.serviceStart || "N/A"}</p>` +
          `<p>Next Election: ${person.nextElection || "N/A"}</p>`;
        const imgDiv = document.getElementById("bioProfileImage");
        if (imgDiv) {
          imgDiv.style.backgroundImage = person.img
            ? `url('${person.img}')`
            : "";
          imgDiv.style.backgroundSize = "cover";
          imgDiv.style.backgroundPosition = "center";
          imgDiv.style.width = "64px";
          imgDiv.style.height = "64px";
          imgDiv.style.borderRadius = "50%";
          imgDiv.style.border = "2px solid #0073ba";
        }
        const partyToken = document.getElementById("bioPartyToken");
        if (partyToken) {
          partyToken.textContent = person.party || "";
          partyToken.style.background = person.partyColor || "#0073ba";
        }
        updateFavoriteStarState();
        toggleBioOverlay(true);
      }
    });
  });
}

function toggleBioOverlay(show) {
  const bioOverlay = document.getElementById("bioOverlay");
  if (!bioOverlay) return;
  if (show) {
    bioOverlay.classList.add("visible");
    document.body.classList.add("body-no-scroll");
    // Ensure the favorite star reflects the current state when opening
    updateFavoriteStarState();
  } else {
    bioOverlay.classList.remove("visible");
    document.body.classList.remove("body-no-scroll");
  }
}

// Attach the function to the global window object
window.toggleBioOverlay = toggleBioOverlay;

const staticImages = [
  "https://www.politico.com/dims4/default/31125ef/2147483647/resize/817x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F60%2F3e%2Fe470dd2b4c9aadd693650ddc493e%2Funlimiteduse-08-18-2025-wh-isp-0023.jpg",
  "https://www.politico.com/dims4/default/962ced0/2147483647/resize/817x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F27%2F5e%2Fd2dbdd394c2689633171a5db378f%2Fu-s-congress-40738.jpg",
  "https://www.politico.com/dims4/default/11a53b1/2147483647/resize/262x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Ffb%2Fca%2F49474393414d841ee2ca0e4516d2%2Fgettyimages-2228950425.jpg",
  "https://tpc.googlesyndication.com/simgad/11794225819168319544?",
  "https://www.politico.com/dims4/default/17b4b8f/2147483647/resize/262x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Fb0%2F72%2Fead3e1a84b20a908342befbb46da%2Fhttps-delivery-gettyimages.com%2Fdownloads%2F2206244896",
  "https://www.politico.com/dims4/default/eff9255/2147483647/resize/262x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Faa%2Fdf%2F0ee45d2741259d778aaf349cdeed%2Fpoilievre-camrose.JPG",
  "https://www.politico.com/dims4/default/52a15ce/2147483647/strip/true/crop/1999x1333+0+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Fbe%2F29%2F1833dcc441bda37c248be0d732a7%2Fgettyimages-2227518322.jpg",
  "https://www.politico.com/dims4/default/4f0d1a4/2147483647/strip/true/crop/5000x3333+0+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2Fd5%2F06%2F4fad23424a098fd4f0b001b2a564%2Fmag-harkin-austintice-lead.jpg",
  "https://www.politico.com/dims4/default/35069d3/2147483647/strip/true/crop/4832x3221+1+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F1d%2F9d%2Fb28709584401bd3da9543152787a%2Fmag-kim-califgovfantasydraft3.jpg",
  "https://www.politico.com/dims4/default/2c84154/2147483647/resize/817x/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F37%2F6c%2F348a0fca4cb994bbb0860cce2882%2Fimmigration-protest-mayor-arrest-41962.jpg",
  "https://www.politico.com/dims4/default/3683a49/2147483647/strip/true/crop/4500x3000+0+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F77%2F7a%2F6cddea734c1595d54481a4ee670d%2Fu-s-congress-93729.jpg",
  "https://www.politico.com/dims4/default/f8341d2/2147483647/strip/true/crop/4500x3000+0+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F35%2F71%2F3c8911c34989a73aa8ab3b3d924e%2Fu-s-congress-93015.jpg",
  "https://www.politico.com/dims4/default/5990fc6/2147483647/strip/true/crop/6000x4000+0+0/resize/816x544!/format/webp/quality/90/?url=https%3A%2F%2Fstatic.politico.com%2F4b%2Fea%2Fbbcd143d44ca819eaf8e1c73f2b0%2Felection-2025-24747.jpg",
];

function setStaticNewsCardImages() {
  const imgs = document.querySelectorAll(".news-card .news-card-image img");
  if (!imgs) return;
  imgs.forEach((img, i) => {
    img.src = staticImages[i % staticImages.length];
    img.loading = "lazy";
    img.width = 600;
    img.height = 400;
    img.onerror = null;
  });
}

const SKIP_OVERLAY_IDS = ["skip-overlay", "skipOverlay", "skipOverlayId"];
function getSkipOverlay() {
  for (const id of SKIP_OVERLAY_IDS) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return document.querySelector("[data-skip-overlay]");
}

document.addEventListener("DOMContentLoaded", async function () {
  // Restore previous session (if any) before honoring deep links
  try {
    const entered = localStorage.getItem("appEntered") === "true";
    if (entered) {
      ensureAppVisible();
      const savedMode = (
        localStorage.getItem("appMode") || "consumer"
      ).toLowerCase();
      setTheme(savedMode === "pro" ? "pro" : "consumer");
    }
  } catch (_) {}
  // Honor deep links on initial load (e.g., #pro-tools, #tools, etc.)
  try {
    handleHashNavigation();
  } catch (_) {}

  // Hide the loading screen and show the login screen as soon as DOM is ready
  const enterButton = document.getElementById("enter-btn"); // Assuming there's an Enter button with this ID
  const loadingScreen = document.getElementById("loading");
  const loginScreen = document.getElementById("login");

  if (enterButton && loadingScreen && loginScreen) {
    enterButton.addEventListener("click", function () {
      loadingScreen.style.display = "flex"; // Show loading screen

      setTimeout(() => {
        loadingScreen.style.display = "none"; // Hide loading screen
        loginScreen.style.display = "flex"; // Show login screen
      }, 1000); // Adjust the delay time (3000ms = 3 seconds)
    });
  }

  // Load Wikimedia portraits, then re-assign person images to use them
  await loadWikimediaHeadshots();
  people.forEach((person, i) => {
    if (person.type === "Committees") {
      person.img = "img/congress-committee-icon.svg";
    } else if (person.type === "Agencies") {
      person.img = "img/agency-icon.svg";
    } else if (!isManualImg(person.img)) {
      // Only assign wiki/fallback if not a manual dataset image
      person.img = getHeadshotUrl(i);
    }
  });

  updateHeroImages([
    "https://www.politico.com/dims4/default/resize/630/quality/90/format/webp?url=https%3A%2F%2Fstatic.politico.com%2F15%2F5f%2F0004f0ba458d9c1b7758ba5dde8c%2Fu-s-congress-42521.jpg", // US Capitol Building
    "https://www.politico.com/dims4/default/resize/630/quality/90/format/webp?url=https%3A%2F%2Fstatic.politico.com%2Faf%2F26%2F227e924f43d5be16d053ccad4262%2Ftrump-smithsonian-94905.jpg", // Congress Chamber
    "https://www.politico.com/dims4/default/resize/630/quality/90/format/webp?url=https%3A%2F%2Fstatic.politico.com%2F42%2F5a%2Ff9f8277940da9fdf1257bd603800%2Fdc-takeover-19779.jpg", // Congressional Hearing
  ]);

  // Initial render
  renderTier2("People");
  const tier2 = document.getElementById("filter-section-2tier");
  if (tier2) {
    tier2.style.display = "none";
  }
  renderPeopleList();
  attachPersonClickHandlers();

  // Ensure favorites in Directories get headshots on first load
  applyHeadshotsToFavorites();

  // Ensure favorites carousel gets headshots and click handlers
  applyHeadshotsToFavoritesCarousel();
  attachFavoritesClickHandlers();

  optimizeNewsCardImages();

  const newsCardImages = document.querySelectorAll(
    ".news-card .news-card-image img"
  );
  if (newsCardImages.length > 0) {
    newsCardImages.forEach((img, i) => {
      img.src = staticImages[i % staticImages.length];
      img.loading = "lazy";
      img.width = 600;
      img.height = 400;
      img.onerror = null; // Remove fallback logic
    });
  } else {
    console.warn("No news card images found in the DOM.");
  }

  setStaticNewsCardImages();
  // REMOVE THIS LINE (no longer merge all legislators on startup):
  // people = [...people, ...legislators].filter(...)
  // Ensure all (including newly added state legislators) have headshots like federal
  assignHeadshotsToAllPeople();
  // Re-render list to reflect any newly assigned images
  renderPeopleList();

  ensureResetButton();

  // Load stored favorites and render them
  loadFavoritesFromStorage();
  renderFavoritesFromStorage();
  // Ensure default favorites also get avatars and clicks
  applyHeadshotsToFavoritesCarousel();
  attachFavoritesClickHandlers();

  // Wire up star button in bio header
  const bioFavBtn = document.getElementById("bio-favorite-btn");
  if (bioFavBtn) {
    bioFavBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      // Try to ensure we have a current person id
      if (currentBioPersonId == null || isNaN(currentBioPersonId)) {
        const derived = resolveCurrentBioPersonIdFromHeader?.();
        if (derived != null) currentBioPersonId = derived;
      }
      if (currentBioPersonId == null || isNaN(currentBioPersonId)) return;

      if (isInFavorites(currentBioPersonId)) {
        removePersonFromFavorites(currentBioPersonId);
      } else {
        addPersonToFavorites(currentBioPersonId);
      }
      updateFavoriteStarState();
    });
  }

  // --- NEW: wire up directory/filter overlay search input ---
  const directorySearchInput = document.querySelector(
    "#filterOverlay .search-input"
  );
  if (directorySearchInput) {
    directorySearchInput.addEventListener("input", function () {
      filterState.search = this.value.trim();
      renderPeopleList();
    });
    directorySearchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        this.value = "";
        filterState.search = "";
        renderPeopleList();
        e.stopPropagation();
      }
    });
  }

  const notif = document.getElementById("notification-overlay");
  if (notif) {
    const actionButtons = notif.querySelectorAll(
      ".notification-actions button"
    );
    actionButtons.forEach((btn) => {
      if (!btn.dataset.closeNotifWired) {
        btn.addEventListener("click", () => {
          notif.style.display = "none";
          // Do not call updateBodyScrollLock here to avoid adding body-no-scroll on initial load
          // If other overlays are open, their own open/close handlers will manage scroll lock
        });
        btn.dataset.closeNotifWired = "true";
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const loginScreen = document.getElementById("login");
  const appRoot = document.getElementById("app");
  const restoredMode = sessionStorage.getItem("appMode");

  if (!restoredMode) {
    if (loginScreen) loginScreen.style.display = "flex";
    if (appRoot) appRoot.style.display = "none";
  } else {
    if (loginScreen) loginScreen.style.display = "none";
    if (appRoot) appRoot.style.display = "block";
  }
});

// (Restored) handleSkip function was removed accidentally; needed before attaching skip button listener
function handleSkip() {
  const userInitials = document.getElementById("user-initials");
  const mainHeaderIcon = document.getElementById("main-header-icon");
  if (userInitials) userInitials.style.display = "none";
  if (mainHeaderIcon) mainHeaderIcon.style.display = "flex";
}

function updateBodyScrollLock() {
  const anyOverlayOpen =
    document.getElementById("bioOverlay")?.classList.contains("visible") ||
    document.getElementById("filterOverlay")?.classList.contains("visible") ||
    document.getElementById("sideOverlay")?.classList.contains("visible") ||
    document.getElementById("article-overlay")?.classList.contains("visible") ||
    document.getElementById("tool-overlay")?.classList.contains("visible") ||
    document.getElementById("skip-overlay")?.classList.contains("visible") ||
    document
      .getElementById("filterOptionOverlay")
      ?.classList.contains("visible");
  document.body.classList.toggle("body-no-scroll", anyOverlayOpen);
}

// --- FILTER CONFIGURATION ---
const filterConfig = {
  tiers: [
    {
      name: "First Tier",
      property: "type",
      options: [
        { value: "People", displayName: "People" },
        { value: "Committees", displayName: "Committees" },
        { value: "Agencies", displayName: "Agencies" },
      ],
    },
    {
      name: "Second Tier",
      property: "location",
      optionsByFirstTier: {
        People: [
          { value: "Federal", displayName: "Federal" },
          { value: "State", displayName: "State" },
          { value: "AGENCY", displayName: "Agencies" },
          { value: "Local", displayName: "California" },
        ],
        Committees: [
          { value: "Federal", displayName: "Federal" },
          { value: "State", displayName: "State" },
        ],
        Agencies: [
          { value: "Federal", displayName: "Federal Agencies" },
          { value: "State", displayName: "State Agencies" },
        ],
      },
    },
    {
      name: "Third Tier",
      property: "state",
      optionsBySecondTier: {
        Federal: [
          { value: "Member", displayName: "Member" },
          { value: "Staff", displayName: "Staff" },
          { value: "Agency", displayName: "Agency" },
        ],
        State: [
          { value: "SELECT_STATE", displayName: "Select State" },
          { value: "Senate", displayName: "Senate" },
          { value: "House", displayName: "House" },
          { value: "Joint", displayName: "Joint" },
        ],
      },
    },
  ],
};

// Add a reset button outside the filter chip group
function ensureResetButton() {
  const filterSectionGroup = document.querySelector(".filter-section-group");
  if (!filterSectionGroup) return;
  let resetBtn = document.querySelector(".filter-reset-btn-global");
  if (!resetBtn) {
    resetBtn = document.createElement("button");
    resetBtn.className = "filter-reset-btn-global";
    resetBtn.setAttribute("aria-label", "Reset filters");
    resetBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#C4CCDB"/>
        <g clip-path="url(#clip0_1127_75)">
          <path d="M4.00005 8.0334L6.82848 5.20497L7.53558 5.91208L5.94764 7.50003L12.5001 7.50003C14.433 7.50003 16.0001 9.06703 16.0001 11C16.0001 12.933 14.433 14.5 12.5001 14.5L9.00005 14.5L9.00005 13.5L12.5001 13.5C13.8808 13.5 15.0001 12.3807 15.0001 11C15.0001 9.61932 13.8808 8.50003 12.5001 8.50003L5.88089 8.50003L7.53559 10.1547L6.82848 10.8618L4.00005 8.0334Z" fill="#5F6C85"/>
        </g>
        <defs>
          <clipPath id="clip0_1127_75">
            <rect width="12" height="12" fill="white" transform="translate(4 4)"/>
          </clipPath>
        </defs>
      </svg>
    `;
    filterSectionGroup.insertBefore(resetBtn, filterSectionGroup.firstChild);
  }
  resetBtn.classList.remove("visible");
  resetBtn.onclick = function () {
    filterState.tier1 = null;
    filterState.tier2 = null;
    filterState.tier3 = null;
    filterState.statePersonType = null; // reset added category filter
    filterState.memberParty = null; // reset party filter
    filterState.memberChamber = null; // reset chamber filter
    renderTier(0);
    for (let i = 1; i < filterConfig.tiers.length; i++) {
      const lowerTier = document.getElementById(`filter-section-${i + 1}tier`);
      if (lowerTier) lowerTier.style.display = i === 0 ? "flex" : "none";
    }
    handleFilterChange();
    resetBtn.classList.remove("visible");
  };
}

// Show the reset button after a filter is selected
function showResetButton() {
  const resetBtn = document.querySelector(".filter-reset-btn-global");
  if (resetBtn) resetBtn.classList.add("visible");
}

// Shared full US states list for People > State selection
const US_STATES = [
  { value: "AL", displayName: "Alabama" },
  { value: "AK", displayName: "Alaska" },
  { value: "AZ", displayName: "Arizona" },
  { value: "AR", displayName: "Arkansas" },
  { value: "CA", displayName: "California" },
  { value: "CO", displayName: "Colorado" },
  { value: "CT", displayName: "Connecticut" },
  { value: "DE", displayName: "Delaware" },
  { value: "FL", displayName: "Florida" },
  { value: "GA", displayName: "Georgia" },
  { value: "HI", displayName: "Hawaii" },
  { value: "ID", displayName: "Idaho" },
  { value: "IL", displayName: "Illinois" },
  { value: "IN", displayName: "Indiana" },
  { value: "IA", displayName: "Iowa" },
  { value: "KS", displayName: "Kansas" },
  { value: "KY", displayName: "Kentucky" },
  { value: "LA", displayName: "Louisiana" },
  { value: "ME", displayName: "Maine" },
  { value: "MD", displayName: "Maryland" },
  { value: "MA", displayName: "Massachusetts" },
  { value: "MI", displayName: "Michigan" },
  { value: "MN", displayName: "Minnesota" },
  { value: "MS", displayName: "Mississippi" },
  { value: "MO", displayName: "Missouri" },
  { value: "MT", displayName: "Montana" },
  { value: "NE", displayName: "Nebraska" },
  { value: "NV", displayName: "Nevada" },
  { value: "NH", displayName: "New Hampshire" },
  { value: "NJ", displayName: "New Jersey" },
  { value: "NM", displayName: "New Mexico" },
  { value: "NY", displayName: "New York" },
  { value: "NC", displayName: "North Carolina" },
  { value: "ND", displayName: "North Dakota" },
  { value: "OH", displayName: "Ohio" },
  { value: "OK", displayName: "Oklahoma" },
  { value: "OR", displayName: "Oregon" },
  { value: "PA", displayName: "Pennsylvania" },
  { value: "RI", displayName: "Rhode Island" },
  { value: "SC", displayName: "South Carolina" },
  { value: "SD", displayName: "South Dakota" },
  { value: "TN", displayName: "Tennessee" },
  { value: "TX", displayName: "Texas" },
  { value: "UT", displayName: "Utah" },
  { value: "VT", displayName: "Vermont" },
  { value: "VA", displayName: "Virginia" },
  { value: "WA", displayName: "Washington" },
  { value: "WV", displayName: "West Virginia" },
  { value: "WI", displayName: "Wisconsin" },
  { value: "WY", displayName: "Wyoming" },
];

// Function to render a tier dynamically
function renderTier(tierIndex) {
  const tier = filterConfig.tiers[tierIndex];
  const container = document.getElementById(
    `filter-section-${tierIndex + 1}tier`
  );
  if (!container) return;

  let options = tier.options;
  if (tierIndex === 1) {
    // Use the selected first-tier value to get the correct second-tier options
    const firstTierValue = filterState.tier1;
    options = filterConfig.tiers[1].optionsByFirstTier[firstTierValue] || [];
  }
  if (tierIndex === 2) {
    // Use the selected second-tier value to get the correct third-tier options
    const secondTierValue = filterState.tier2;
    options = filterConfig.tiers[2].optionsBySecondTier[secondTierValue] || [];
  }

  // NEW: Special case for People > Federal > 3rd tier
  if (
    tierIndex === 2 &&
    filterState.tier1 === "People" &&
    filterState.tier2 === "Federal" &&
    filterState.tier3 === "Agency"
  ) {
    const chevron = filterState.tier2
      ? '<span class="filter-chevron">›</span>'
      : "";
    container.innerHTML = `${chevron}<button class="filter-chip active" data-value="Agency">Agency</button>`;
    const agencyChip = container.querySelector("button.filter-chip.active");
    if (agencyChip) {
      agencyChip.addEventListener("click", () => {
        // Reset tier3 when clicking active Agency
        filterState.tier3 = null;
        renderTier(2);
        handleFilterChange();
        renderPeopleList();
      });
    }
    container.style.display = "flex";
    container.style.flexDirection = "row";
    return;
  }

  // NEW: Special case for People > Federal > Member (show party + chamber chips)
  if (
    tierIndex === 2 &&
    filterState.tier1 === "People" &&
    filterState.tier2 === "Federal" &&
    (filterState.tier3 === "Member" || filterState.tier3 === "Staff")
  ) {
    const activeLabel = filterState.tier3; // Member or Staff
    const chevron = filterState.tier2
      ? '<span class="filter-chevron">›</span>'
      : "";
    container.innerHTML = `
      ${chevron}
      <button class="filter-chip active" data-value="${activeLabel}">${activeLabel}</button>
      <span class="filter-chevron">›</span>
      <button class="filter-chip federal-member-filter" data-filter-type="party" data-value="Democrat">Democrat</button>
      <button class="filter-chip federal-member-filter" data-filter-type="party" data-value="Republican">Republican</button>
      <button class="filter-chip federal-member-filter" data-filter-type="chamber" data-value="Senate">Senate</button>
      <button class="filter-chip federal-member-filter" data-filter-type="chamber" data-value="House">House</button>
    `;

    // NEW: Allow back/reset by clicking the active Member chip
    const activeChip = container.querySelector(
      `button.filter-chip.active[data-value="${activeLabel}"]`
    );
    if (activeChip) {
      activeChip.addEventListener("click", () => {
        // Reset just the third tier and its sub-filters
        filterState.tier3 = null;
        filterState.memberParty = null;
        filterState.memberChamber = null;
        // Re-render normal tier-3 chips
        renderTier(2);
        handleFilterChange();
        renderPeopleList();
      });
    }

    // Restore active states if already selected
    container.querySelectorAll(".federal-member-filter").forEach((chip) => {
      const filterType = chip.getAttribute("data-filter-type");
      const value = chip.getAttribute("data-value");
      if (
        (filterType === "party" && filterState.memberParty === value) ||
        (filterType === "chamber" && filterState.memberChamber === value)
      ) {
        chip.classList.add("active");
      }

      chip.addEventListener("click", function () {
        const type = this.getAttribute("data-filter-type");
        const val = this.getAttribute("data-value");

        if (type === "party") {
          // Toggle party selection
          if (filterState.memberParty === val) {
            filterState.memberParty = null;
            this.classList.remove("active");
          } else {
            filterState.memberParty = val;
            container
              .querySelectorAll('[data-filter-type="party"]')
              .forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
          }
        } else if (type === "chamber") {
          // Toggle chamber selection
          if (filterState.memberChamber === val) {
            filterState.memberChamber = null;
            this.classList.remove("active");
          } else {
            filterState.memberChamber = val;
            container
              .querySelectorAll('[data-filter-type="chamber"]')
              .forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
          }
        }

        renderPeopleList();
        showResetButton();
      });
    });

    container.style.display = "flex";
    container.style.flexDirection = "row";
    return;
  }

  // Add special case for Committees > State third tier (state selection + chamber options)
  if (
    tierIndex === 2 &&
    filterState.tier1 === "Committees" &&
    filterState.tier2 === "State"
  ) {
    // For Committees > State, show both state selection AND chamber options in same tier
    const stateSelectBtn = options.find((opt) => opt.value === "SELECT_STATE");
    const chamberOptions = options.filter(
      (opt) => opt.value !== "SELECT_STATE"
    );

    let stateLabel = "Select State";
    if (filterState.tier3 && filterState.tier3 !== "SELECT_STATE") {
      const stateOpt = filterConfig.tiers[2].optionsBySecondTier.State.find(
        (s) => s.value === filterState.tier3
      );
      if (stateOpt) stateLabel = stateOpt.displayName;
    }

    // Create buttons for both state selection and chamber options with chevron
    const chevron = filterState.tier2
      ? '<span class="filter-chevron">›</span>'
      : "";
    const stateButton = `${chevron}<button class="filter-chip" id="open-state-overlay-committees">${stateLabel}</button>`;
    const chamberButtons = chamberOptions
      .map(
        (option) =>
          `<button class="filter-chip" data-value="${option.value}">${option.displayName}</button>`
      )
      .join("");

    container.innerHTML = stateButton + chamberButtons;

    // Add state overlay handler
    document.getElementById("open-state-overlay-committees").onclick =
      function () {
        showStateOverlayForCommittees();
      };

    // Add chamber option handlers
    container.querySelectorAll(".filter-chip[data-value]").forEach((btn) => {
      btn.addEventListener("click", function () {
        // Toggle active state for chamber options
        container
          .querySelectorAll(".filter-chip[data-value]")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        const selectedValue = this.getAttribute("data-value");
        filterState.tier3 = selectedValue;
        handleFilterChange();
        renderPeopleList();
        showResetButton();
      });
    });

    container.style.display = "flex";
    container.style.flexDirection = "row";
    return;
  }

  // Add chevron before chips if previous tier exists
  const chevronHtml =
    tierIndex > 0 && filterState[`tier${tierIndex}`]
      ? '<span class="filter-chevron">›</span>'
      : "";

  container.innerHTML =
    chevronHtml +
    options
      .map(
        (option) =>
          `<button class="filter-chip" data-value="${option.value}">${option.displayName}</button>`
      )
      .join("");

  const chips = container.querySelectorAll(".filter-chip");
  if (!chips) return;

  chips.forEach((btn) => {
    btn.addEventListener("click", function () {
      // NEW: Back/reset behavior when clicking an already-active chip
      if (this.classList.contains("active")) {
        if (tierIndex === 0) {
          // Reset everything to initial state
          filterState.tier1 = null;
          filterState.tier2 = null;
          filterState.tier3 = null;
          filterState.memberParty = null;
          filterState.memberChamber = null;
          // Re-render tiers and hide lower ones
          renderTier(0);
          const t2 = document.getElementById("filter-section-2tier");
          const t3 = document.getElementById("filter-section-3tier");
          if (t2) t2.style.display = "none";
          if (t3) t3.style.display = "none";
          handleFilterChange();
          renderPeopleList();
          // Optionally hide reset button if present
          const resetBtn = document.querySelector(".filter-reset-btn-global");
          if (resetBtn) resetBtn.classList.remove("visible");
          return; // stop further handling
        }
        if (tierIndex === 1) {
          // Clear this tier and below
          filterState.tier2 = null;
          filterState.tier3 = null;
          filterState.memberParty = null;
          filterState.memberChamber = null;
          // Re-render this tier with all chips visible and hide next tier
          renderTier(1);
          const t3 = document.getElementById("filter-section-3tier");
          if (t3) t3.style.display = "none";
          handleFilterChange();
          renderPeopleList();
          return;
        }
        if (tierIndex === 2) {
          // Clear only tier3 and sub-filters
          filterState.tier3 = null;
          filterState.memberParty = null;
          filterState.memberChamber = null;
          renderTier(2);
          handleFilterChange();
          renderPeopleList();
          return;
        }
      }

      if (tierIndex === 0) {
        // Reset lower tiers when first tier is selected
        const selectedValue = this.getAttribute("data-value");
        filterState.tier1 = selectedValue;
        filterState.tier2 = null;
        filterState.tier3 = null;
        filterState.memberParty = null; // reset party on tier1 change
        filterState.memberChamber = null; // reset chamber on tier1 change
        renderTier(1);
        renderTier(2);
      }

      const selectedValue = this.getAttribute("data-value");

      // NEW: Special handling for tier 3 - don't hide chips, just highlight
      if (tierIndex === 2) {
        // For tier 3, just toggle active state without hiding
        chips.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
      } else if (tierIndex < filterConfig.tiers.length - 1) {
        // Hide all sibling chips except the selected one for tiers 1 and 2 only
        chips.forEach((b) => {
          if (b === this) {
            b.classList.add("active");
            b.classList.remove("hidden");
          } else {
            b.classList.remove("active");
            b.classList.add("hidden");
          }
        });
      }

      // Always set the correct tier property
      filterState[`tier${tierIndex + 1}`] = selectedValue;
      // Remove filterState.type to avoid confusion
      delete filterState.type;

      // NEW: If "Member" was clicked on People > Federal, re-render tier 3 to show party/chamber chips
      if (
        tierIndex === 2 &&
        filterState.tier1 === "People" &&
        filterState.tier2 === "Federal" &&
        (selectedValue === "Member" || selectedValue === "Staff")
      ) {
        renderTier(2); // Re-render this tier to show the expanded chips
        return; // Skip the rest to avoid double rendering
      }

      // Trigger Agency special-case re-render (hide siblings) after selection
      if (
        tierIndex === 2 &&
        filterState.tier1 === "People" &&
        filterState.tier2 === "Federal" &&
        selectedValue === "Agency"
      ) {
        renderTier(2);
        handleFilterChange();
        renderPeopleList();
        return;
      }

      handleFilterChange();
      renderPeopleList();
      // Show the next tier if it exists
      if (tierIndex + 1 < filterConfig.tiers.length) {
        renderTier(tierIndex + 1);
        const nextTierContainer = document.getElementById(
          `filter-section-${tierIndex + 2}tier`
        );
        if (nextTierContainer) {
          nextTierContainer.style.display = "flex";
          nextTierContainer.style.flexDirection = "row";
        }
      }
      // Hide all tiers below the next one (not the next one itself)
      for (let i = tierIndex + 2; i < filterConfig.tiers.length; i++) {
        const lowerTier = document.getElementById(
          `filter-section-${i + 1}tier`
        );
        if (lowerTier) lowerTier.style.display = "none";
      }
      showResetButton();
    });
  });

  // Show this tier's container as flex row
  container.style.display = "flex";
  container.style.flexDirection = "row";

  // If this is the first tier, always show the second tier container (even if no chip is selected)
  if (tierIndex === 0 && filterConfig.tiers.length > 1) {
    const nextTierContainer = document.getElementById(`filter-section-2tier`);
    if (nextTierContainer) {
      nextTierContainer.style.display = "flex";
      nextTierContainer.style.flexDirection = "row";
    }
  }
}

// Initialize the first tier
renderTier(0);

// --- FILTER LOGIC ---
function renderPeopleList() {
  let filtered = people;
  const list = document.querySelector(".people-list");
  const recentsLabel = document.getElementById("recents-label");
  if (!list) return;

  // Show recents only if no filter and no search
  if (
    !filterState.tier1 &&
    !filterState.tier2 &&
    !filterState.tier3 &&
    !filterState.search?.trim()
  ) {
    if (recentsLabel) recentsLabel.style.display = "";
    list.innerHTML = renderRecentsList();
    attachPersonClickHandlers();
    return;
  }
  if (recentsLabel) recentsLabel.style.display = "none";

  // Flexible filtering using filterConfig properties
  filterConfig.tiers.forEach((tier, i) => {
    const tierValue = filterState[`tier${i + 1}`];
    if (tierValue) {
      // Special logic for People > Federal > 3rd tier
      if (
        i === 2 &&
        filterState.tier1 === "People" &&
        filterState.tier2 === "Federal"
      ) {
        if (tierValue === "Member" || tierValue === "Staff") {
          filtered = filtered.filter((p) => p.role.includes(tierValue));
          // Apply additional filters for party and chamber
          if (filterState.memberParty) {
            filtered = filtered.filter(
              (p) =>
                p.party &&
                p.party.toLowerCase() === filterState.memberParty.toLowerCase()
            );
          }
          if (filterState.memberChamber) {
            filtered = filtered.filter((p) =>
              p.role
                .toLowerCase()
                .includes(filterState.memberChamber.toLowerCase())
            );
          }
        } else if (tierValue === "Staff") {
          filtered = filtered.filter((p) => p.role.includes("Staff"));
        } else if (tierValue === "Agency") {
          filtered = filtered.filter((p) =>
            p.role.toLowerCase().includes("agency")
          );
        }
      } else if (
        i === 2 &&
        filterState.tier1 === "People" &&
        filterState.tier2 === "State"
      ) {
        filtered = filtered.filter((p) => {
          if (!p.nameWithDistrict) return false;
          const match = p.nameWithDistrict.match(/\|\s([A-Z]{2})[-\s]/);
          if (match) {
            return match[1] === tierValue;
          }
          return p.nameWithDistrict.includes(tierValue);
        });
        return;
      } else if (
        i === 2 &&
        filterState.tier1 === "Committees" &&
        filterState.tier2 === "Federal"
      ) {
        // Special logic for Committees > Federal > 3rd tier
        if (tierValue === "Senate") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("senate")
          );
        } else if (tierValue === "House") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("house")
          );
        } else if (tierValue === "Joint") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("joint")
          );
        }
      } else if (
        i === 2 &&
        filterState.tier1 === "Committees" &&
        filterState.tier2 === "State"
      ) {
        // Special logic for Committees > State > 3rd tier
        if (tierValue === "Senate") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("senate")
          );
        } else if (tierValue === "House") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("house")
          );
        } else if (tierValue === "Joint") {
          filtered = filtered.filter(
            (p) =>
              p.type === "Committees" && p.role.toLowerCase().includes("joint")
          );
        } else {
          // Handle state selection (when a specific state is selected)
          filtered = filtered.filter((p) => {
            if (p.type !== "Committees") return false;
            return p.location === tierValue || p.state === tierValue;
          });
        }
      } else {
        filtered = filtered.filter((p) => p[tier.property] === tierValue);
      }
    }
  });

  // Additional category filtering for People > State
  if (
    filterState.tier1 === "People" &&
    (filterState.tier2 === "State" || filterState.tier2 === "States") &&
    filterState.statePersonType
  ) {
    if (filterState.statePersonType === "Legislator") {
      filtered = filtered.filter((p) =>
        /senate|house|representative|senator|assembly/i.test(p.role || "")
      );
    } else if (filterState.statePersonType === "Legislative Staff") {
      filtered = filtered.filter((p) =>
        /staff|assistant|chief of staff|aide/i.test(p.role || "")
      );
    }
  }

  // Search
  if (filterState.search) {
    filtered = filtered.filter(
      (p) =>
        (p.name &&
          p.name.toLowerCase().includes(filterState.search.toLowerCase())) ||
        (p.role &&
          p.role.toLowerCase().includes(filterState.search.toLowerCase()))
    );
  }

  if (filtered.length === 0) {
    const searchMsg = filterState.search ? ` for "${filterState.search}"` : "";
    list.innerHTML = `<li class="person-suggestion"><div class="person-info"><span class="person-name">No results found${searchMsg}</span></div></li>`;
    return;
  }

  list.innerHTML = filtered
    .map((person) => {
      const isSvg = person.img && person.img.endsWith(".svg");
      let extraClass = "";
      if (isSvg && person.type === "Committees") extraClass = "committee-icon";
      if (isSvg && person.type === "Agencies") extraClass = "agency-icon";
      return `
        <li class="person-suggestion" data-person-id="${people.indexOf(
          person
        )}">
          <img src="${person.img}" alt="${person.name}" class="person-avatar${
        extraClass ? " " + extraClass : ""
      }" />
          <div class="person-info">
            <span class="person-name">${person.name}</span>
            <span class="person-role">${person.role}</span>
          </div>
        </li>
      `;
    })
    .join("");

  // Attach per-item image fallbacks (primary -> picsum -> SVG)
  list.querySelectorAll("li.person-suggestion").forEach((li) => {
    const idx = parseInt(li.getAttribute("data-person-id"), 10);
    const img = li.querySelector("img.person-avatar");
    if (img && people[idx]) {
      setImgWithFallback(
        img,
        people[idx].img,
        getFallbackHeadshotUrl(idx),
        people[idx].name || "Avatar"
      );
    }
  });

  // Attach click handlers to new list items
  attachPersonClickHandlers();
}

// Helper: Render recents list (stub, replace with real logic as needed)
function renderRecentsList() {
  const recents = recentPersonIds.map((id) => people[id]).filter(Boolean);
  if (recents.length === 0) {
    return '<li class="person-suggestion"><div class="person-info"><span class="person-name">No recent selections</span></div></li>';
  }
  return recents
    .map((person) => {
      const isSvg = person.img && person.img.endsWith(".svg");
      return `
    <li class="person-suggestion" data-person-id="${people.indexOf(person)}">
      ${
        isSvg
          ? `<img src="${person.img}" alt="${person.name}" class="person-avatar committee-icon" />`
          : `<img src="${person.img}" alt="${person.name}" class="person-avatar" />`
      }
      <div class="person-info">
        <span class="person-name">${person.name}</span>
        <span class="person-role">${person.role}</span>
      </div>
      <button class="remove-recent-btn" data-remove-id="${people.indexOf(
        person
      )}" title="Remove from recents">&times;</button>
    </li>
  `;
    })
    .join("");
}

// Add event delegation for removing recents
const peopleList = document.querySelector(".people-list");
if (peopleList) {
  peopleList.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-recent-btn")) {
      const removeId = Number(e.target.getAttribute("data-remove-id"));
      recentPersonIds = recentPersonIds.filter((id) => id !== removeId);
      saveRecentsToStorage();
      renderPeopleList();
      e.stopPropagation();
    }
  });
}

// Attach click listeners to each person in the people list
function attachPersonClickHandlers() {
  document.querySelectorAll(".people-list .person-suggestion").forEach((el) => {
    el.addEventListener("click", function (event) {
      // Prevent opening profile if X was clicked
      if (event.target.classList.contains("remove-recent-btn")) {
        return;
      }
      const personId = this.getAttribute("data-person-id");
      const person = people.find((p, idx) => idx.toString() === personId);
      if (person) {
        currentBioPersonId = Number(personId); // track current person for star state
        addRecentPerson(Number(personId));
        document.getElementById("bioNameWithDistrict").textContent =
          person.nameWithDistrict || person.name;
        document.getElementById("bioServiceDetails").innerHTML =
          `<p>${person.role}</p>` +
          `<p>Service Start: ${person.serviceStart || "N/A"}</p>` +
          `<p>Next Election: ${person.nextElection || "N/A"}</p>`;
        const imgDiv = document.getElementById("bioProfileImage");
        if (imgDiv) {
          imgDiv.style.backgroundImage = person.img
            ? `url('${person.img}')`
            : "";
          imgDiv.style.backgroundSize = "cover";
          imgDiv.style.backgroundPosition = "center";
          imgDiv.style.width = "64px";
          imgDiv.style.height = "64px";
          imgDiv.style.borderRadius = "50%";
          imgDiv.style.border = "2px solid #0073ba";
        }
        const partyToken = document.getElementById("bioPartyToken");
        if (partyToken) {
          partyToken.textContent = person.party || "";
          partyToken.style.background = person.partyColor || "#0073ba";
          partyToken.style.color = "#fff";
        }
        updateFavoriteStarState();
        toggleBioOverlay(true);
      }
    });
  });
}

// Store recent selections in memory and persist to localStorage
let recentPersonIds = [];
const RECENTS_MAX = 5;

function loadRecentsFromStorage() {
  try {
    const stored = localStorage.getItem("recentPersonIds");
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        recentPersonIds = arr;
      }
    }
  } catch (e) {}
}

function saveRecentsToStorage() {
  try {
    localStorage.setItem("recentPersonIds", JSON.stringify(recentPersonIds));
  } catch (e) {}
}

function addRecentPerson(personId) {
  recentPersonIds = recentPersonIds.filter((id) => id !== personId);
  recentPersonIds.unshift(personId);
  if (recentPersonIds.length > RECENTS_MAX)
    recentPersonIds.length = RECENTS_MAX;
  saveRecentsToStorage();
}

// On page load, restore recents
loadRecentsFromStorage();

function openFilterOptionOverlay(title, options, onSelect) {
  const overlay = document.getElementById("filterOptionOverlay");
  const list = document.getElementById("filterOptionList");
  const titleEl = document.getElementById("filterOptionTitle");
  titleEl.textContent = title;
  list.innerHTML = options
    .map(
      (opt) => `<button type="button" class="filter-option-btn">${opt}</button>`
    )
    .join("");
  overlay.classList.add("visible");

  // Remove previous listeners
  Array.from(list.children).forEach((btn, i) => {
    btn.onclick = () => {
      overlay.classList.remove("visible");
      onSelect(options[i]);
    };
  });
}

function closeFilterOptionOverlay() {
  document.getElementById("filterOptionOverlay").classList.remove("visible");
}

const filterState = {
  tier1: null,
  tier2: null,
  tier3: null,
  location: null, // "Federal", "State", "Local"
  type: [], // ["Members", "Committees", ...]
  search: "", // Search term
  firstTier: null, // Track first-tier selection
  statePersonType: null, // People > State category (Legislator | Legislative Staff)
  memberParty: null, // People > Federal > Member > Party (Democrat | Republican)
  memberChamber: null, // People > Federal > Member > Chamber (Senate | House)
};

const tier2Options = {
  People: ["Federal", "State", "Agencies", "California"], // changed 'States' -> 'State'
  Committees: ["Federal", "state"],
  Agencies: ["Federal", "State"],
};

// When a first-tier filter is clicked, set firstTier and clear type/location
function onFirstTierFilter(selected) {
  filterState.firstTier = selected;
  filterState.secondTier = null; // Reset second tier when first tier changes
  filterState.thirdTier = null; // Reset third tier when first tier changes
  filterState.statePersonType = null; // clear category on tier change

  renderTier2(selected); // Render the 2nd tier based on the selected 1st tier

  const tier2 = document.getElementById("filter-section-2tier");
  const tier3 = document.getElementById("filter-section-3tier");

  if (selected === "All") {
    tier2.style.display = "none";
    tier3.style.display = "none"; // Ensure 3rd tier is hidden
    filterState.type = [];
  } else {
    tier2.style.display = "";
    tier3.style.display = "none"; // Reset 3rd tier visibility
  }

  handleFilterChange(); // Update the displayed data
}

// When a second-tier filter is clicked, set secondTier and call handleFilterChange
function onSecondTierFilter(selected) {
  filterState.secondTier = selected;
  filterState.thirdTier = null; // Reset third tier when second tier changes
  filterState.statePersonType = null; // clear category when switching State/Federal
  renderTier3(selected); // Render the 3rd tier based on the selected 2nd tier

  // Ensure the 3rd tier is hidden if no options are available
  const tier3Section = document.getElementById("filter-section-3tier");
  if (!filterConfig.People.secondTier.thirdTier[selected]?.length) {
    tier3Section.style.display = "none";
  }

  handleFilterChange(); // Update the displayed data
}

// Update the logic to ensure proper hide/show behavior for the 2nd tier
function renderTier2(selectedTier1) {
  const tier2Container = document.querySelector(
    "#filter-section-2tier .filter-chips"
  );
  if (!tier2Container) return;

  // Populate second-tier options based on the selected first-tier filter
  const options = tier2Options[selectedTier1] || [];
  tier2Container.innerHTML = options
    .map((option) => `<button class="filter-chip">${option}</button>`)
    .join("");

  tier2Container.querySelectorAll(".filter-chip").forEach((btn) => {
    btn.addEventListener("click", function () {
      // Hide other chips and highlight the selected one
      tier2Container.querySelectorAll(".filter-chip").forEach((b) => {
        if (b === this) {
          b.classList.add("active");
          b.classList.remove("hidden");
        } else {
          b.classList.remove("active");
          b.classList.add("hidden");
        }
      });

      // Call the handler for the selected second-tier filter
      onSecondTierFilter(this.textContent);
    });
  });

  // Show or hide the second-tier container based on available options
  const tier2Section = document.getElementById("filter-section-2tier");
  if (options.length > 0) {
    tier2Section.style.display = "block";
  } else {
    tier2Section.style.display = "none";
  }
}

// Ensure the hide/show behavior is applied only to the 1st and 2nd tiers
function renderTier3(selectedTier2) {
  const tier3Container = document.querySelector(
    "#filter-section-3tier .filter-chips"
  );
  if (!tier3Container) return;

  let options = [];
  if (selectedTier2 === "Federal") {
    const federalOptions = filterConfig.People.secondTier.thirdTier.Federal;
    options =
      typeof federalOptions === "function" ? federalOptions() : federalOptions;
  } else {
    options = filterConfig.People.secondTier.thirdTier[selectedTier2] || [];
  }

  tier3Container.innerHTML = options
    .map((option) => `<button class='filter-chip'>${option}</button>`)
    .join("");

  tier3Container.querySelectorAll(".filter-chip").forEach((btn) => {
    btn.addEventListener("click", function () {
      tier3Container
        .querySelectorAll(".filter-chip")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filterState.thirdTier = this.textContent;
      handleFilterChange();
    });
  });

  const tier3Section = document.getElementById("filter-section-3tier");
  if (options.length > 0) {
    tier3Section.style.display = "block";
  } else {
    tier3Section.style.display = "none";
  }
}

function handleFilterChange() {
  // Only load state legislators when user selects People > State
  if (
    filterState.tier1 === "People" &&
    (filterState.tier2 === "State" || filterState.tier2 === "States")
  ) {
    ensureStateLegislatorsLoaded();
  }
  renderPeopleList();
}

function closeAllOverlays() {
  document.getElementById("filterOverlay")?.classList.remove("visible");
  document.getElementById("sideOverlay")?.classList.remove("visible");
  document.getElementById("bioOverlay")?.classList.remove("visible");
  document.getElementById("filterOptionOverlay")?.classList.remove("visible");
  document.body.classList.remove("body-no-scroll");
}

function addNewsCardPills() {
  document.querySelectorAll(".news-card").forEach((card) => {
    const tagsContainer = card.querySelector(".news-card-tags");
    if (!tagsContainer) return;
    // Remove any existing pills
    tagsContainer.innerHTML = "";
    // Check for a data-tag attribute
    const tag = card.getAttribute("data-tag");
    if (tag === "PRO") {
      const pill = document.createElement("span");
      pill.className = "news-card-tag";
      pill.textContent = "PRO";
      tagsContainer.appendChild(pill);
    } else if (tag === "Consumer") {
      // Optionally add a Consumer pill, or leave empty
      // const pill = document.createElement("span");
      // pill.className = "news-card-tag";
      // pill.textContent = "Consumer";
      // tagsContainer.appendChild(pill);
    }
  });
}

function updateHeroImages(imageUrls) {
  document.querySelectorAll(".hero-image-container").forEach((container, i) => {
    let img = container.querySelector("img.hero-image");
    if (!img) {
      img = document.createElement("img");
      img.className = "hero-image";
      container.appendChild(img);
    }
    const primary = imageUrls[i % imageUrls.length];
    const fallback = `https://picsum.photos/seed/hero${i}/800/400`;
    setImgWithFallback(img, primary, fallback, "Hero");
    img.alt = "Hero Image " + (i + 1);
  });
}
// Example: attach to your Skip button
const skipBtn = document.getElementById("skip-btn");
if (skipBtn) {
  skipBtn.addEventListener("click", handleSkip);
}

function toggleOverlay(visible) {
  const overlay = document.getElementById("filterOverlay");
  if (overlay) {
    overlay.classList.toggle("visible", visible);
    if (visible) {
      const input = overlay.querySelector(".search-input");
      if (input) {
        input.value = filterState.search || "";
        requestAnimationFrame(() => input.focus());
      }
    }
  }
}

// Attach the function to the global window object
window.toggleOverlay = toggleOverlay;

function optimizeNewsCardImages() {
  document
    .querySelectorAll(".news-card .news-card-image img")
    .forEach((img) => {
      img.loading = "lazy";
      // Optionally set width/height if not present
      if (!img.width) img.width = 600;
      if (!img.height) img.height = 400;
    });
}

// Overlay HTML injection (if not present)
if (!document.getElementById("state-overlay")) {
  const overlayDiv = document.createElement("div");
  overlayDiv.id = "state-overlay";
  overlayDiv.className = "state-overlay";
  overlayDiv.innerHTML = `
    <div class="state-overlay-content">
      <div class="state-overlay-handle"></div>
      <div class="state-overlay-header">
        <button class="state-overlay-close" aria-label="Close">&times;</button>
        <span class="state-overlay-title">Select a State</span>
      </div>
      <ul class="state-list"></ul>
    </div>
  `;
  document.body.appendChild(overlayDiv);
  // Add close button handler
  overlayDiv.querySelector(".state-overlay-close").onclick = function () {
    overlayDiv.classList.remove("visible");
  };
}

function showStateOverlay() {
  const overlay = document.getElementById("state-overlay");
  const list = overlay.querySelector(".state-list");
  // Use full states list for People > State; leave committees handler separate
  const stateOptions = US_STATES;
  list.innerHTML = stateOptions
    .map((s) => `<li data-value="${s.value}">${s.displayName}</li>`)
    .join("");
  Array.from(list.children).forEach((li) => {
    if (li.getAttribute("data-value") === filterState.tier3) {
      li.classList.add("selected");
    }
    li.onclick = function () {
      filterState.tier3 = this.getAttribute("data-value");
      overlay.classList.remove("visible");
      handleFilterChange();
      renderPeopleList();
      renderTier(2); // update button label
      showResetButton();
    };
  });
  overlay.classList.add("visible");
  const closeBtn = overlay.querySelector(".state-overlay-close");
  if (closeBtn)
    closeBtn.onclick = function () {
      overlay.classList.remove("visible");
    };
}

window.addEventListener("mousedown", function (e) {
  const overlay = document.getElementById("state-overlay");
  if (
    overlay &&
    overlay.classList.contains("visible") &&
    !overlay.querySelector(".state-overlay-content").contains(e.target)
  ) {
    overlay.classList.remove("visible");
  }
});

function showStateOverlayForCommittees() {
  const overlay = document.getElementById("state-overlay");
  const list = overlay.querySelector(".state-list");
  const titleEl = overlay.querySelector(".state-overlay-title");
  titleEl.textContent = "Select a State";

  // Get the actual state options (AL, AK, etc.) not the chamber options
  const stateOptions = [
    { value: "AL", displayName: "Alabama" },
    { value: "AK", displayName: "Alaska" },
    { value: "AZ", displayName: "Arizona" },
    { value: "AR", displayName: "Arkansas" },
    { value: "CA", displayName: "California" },
    { value: "CO", displayName: "Colorado" },
    { value: "CT", displayName: "Connecticut" },
    { value: "DE", displayName: "Delaware" },
    { value: "FL", displayName: "Florida" },
    { value: "GA", displayName: "Georgia" },
    { value: "HI", displayName: "Hawaii" },
    { value: "ID", displayName: "Idaho" },
    { value: "IL", displayName: "Illinois" },
    { value: "IN", displayName: "Indiana" },
    { value: "IA", displayName: "Iowa" },
    { value: "KS", displayName: "Kansas" },
    { value: "KY", displayName: "Kentucky" },
    { value: "LA", displayName: "Louisiana" },
    { value: "ME", displayName: "Maine" },
    { value: "MD", displayName: "Maryland" },
    { value: "MA", displayName: "Massachusetts" },
    { value: "MI", displayName: "Michigan" },
    { value: "MN", displayName: "Minnesota" },
    { value: "MS", displayName: "Mississippi" },
    { value: "MO", displayName: "Missouri" },
    { value: "MT", displayName: "Montana" },
    { value: "NE", displayName: "Nebraska" },
    { value: "NV", displayName: "Nevada" },
    { value: "NH", displayName: "New Hampshire" },
    { value: "NJ", displayName: "New Jersey" },
    { value: "NM", displayName: "New Mexico" },
    { value: "NY", displayName: "New York" },
    { value: "NC", displayName: "North Carolina" },
    { value: "ND", displayName: "North Dakota" },
    { value: "OH", displayName: "Ohio" },
    { value: "OK", displayName: "Oklahoma" },
    { value: "OR", displayName: "Oregon" },
    { value: "PA", displayName: "Pennsylvania" },
    { value: "RI", displayName: "Rhode Island" },
    { value: "SC", displayName: "South Carolina" },
    { value: "SD", displayName: "South Dakota" },
    { value: "TN", displayName: "Tennessee" },
    { value: "TX", displayName: "Texas" },
    { value: "UT", displayName: "Utah" },
    { value: "VT", displayName: "Vermont" },
    { value: "VA", displayName: "Virginia" },
    { value: "WA", displayName: "Washington" },
    { value: "WV", displayName: "West Virginia" },
    { value: "WI", displayName: "Wisconsin" },
    { value: "WY", displayName: "Wyoming" },
  ];

  list.innerHTML = stateOptions
    .map((s) => `<li data-value="${s.value}">${s.displayName}</li>`)
    .join("");
  Array.from(list.children).forEach((li) => {
    if (li.getAttribute("data-value") === filterState.tier3) {
      li.classList.add("selected");
    }
    li.onclick = function () {
      const selectedState = this.getAttribute("data-value");
      const selectedStateName = this.textContent;

      // Update the "Select State" button text to show selected state
      const stateButton = document.getElementById(
        "open-state-overlay-committees"
      );
      if (stateButton) {
        stateButton.textContent = selectedStateName;
      }

      // Store the selected state value for filtering
      filterState.selectedState = selectedState;

      overlay.classList.remove("visible");
      handleFilterChange();
      renderPeopleList();
      showResetButton();
    };
  });
  overlay.classList.add("visible");
}

function assignHeadshotsToAllPeople() {
  people.forEach((person, i) => {
    if (person.type === "Committees") {
      person.img = "img/congress-committee-icon.svg";
      return;
    }
    if (person.type === "Agencies") {
      person.img = "img/agency-icon.svg";
      return;
    }
    // For People (Federal or State) use same approach; overwrite only if missing or not manual
    if (!person.img || !isManualImg(person.img)) {
      person.img = getHeadshotUrl(i);
    }
  });
}

// Provide a toggle function for the side overlay (directories / favorites panel)
function toggleSideOverlay(show) {
  const side = document.getElementById("sideOverlay");
  if (!side) return; // Safeguard if element not in DOM yet
  if (show) {
    side.classList.add("visible");
  } else {
    side.classList.remove("visible");
  }
  // Recompute scroll lock state based on any open overlays
  if (typeof updateBodyScrollLock === "function") {
    updateBodyScrollLock();
  } else {
    // Fallback: simple body lock/unlock
    const anyOpen = document.querySelector(
      "#bioOverlay.visible, #filterOverlay.visible, #sideOverlay.visible, #filterOptionOverlay.visible"
    );
    document.body.classList.toggle("body-no-scroll", !!anyOpen);
  }
}
// Expose globally for inline onclick handlers
window.toggleSideOverlay = toggleSideOverlay;

(function initAuthUI() {
  if (window.__authUIWired) return;
  // Core auth surface references
  const loginScreen = document.getElementById("login");
  const successScreen = document.getElementById("login-success");
  const accountScreen = document.getElementById("account-creation"); // optional (may not exist)
  const skipOverlay = document.getElementById("skip-overlay"); // optional (may not exist)

  // passwordless surfaces
  const passwordlessScreen = document.getElementById("passwordless");
  const passwordlessConfirmScreen = document.getElementById(
    "passwordless-confirm"
  );

  const SUCCESS_ANIMATION_DURATION = 4600; // ms

  function hideAllAuthSurfaces() {
    loginScreen && (loginScreen.style.display = "none");
    successScreen && (successScreen.style.display = "none");
    accountScreen && (accountScreen.style.display = "none");
    skipOverlay && (skipOverlay.style.display = "none");
    passwordlessScreen && (passwordlessScreen.style.display = "none");
    passwordlessConfirmScreen &&
      (passwordlessConfirmScreen.style.display = "none");
  }

  function showLogin() {
    hideAllAuthSurfaces();
    loginScreen && (loginScreen.style.display = "flex");
  }

  function showPasswordless() {
    hideAllAuthSurfaces();
    if (passwordlessScreen) passwordlessScreen.style.display = "flex";
    // clear any old errors and focus the input
    const err = document.getElementById("passwordless-error");
    const email = document.getElementById("passwordless-email");
    if (err) {
      err.textContent = "";
      err.style.display = "none";
    }
    email?.classList.remove("input-error");
    requestAnimationFrame(() => email?.focus());
  }

  function showPasswordlessConfirmation(email) {
    // Use the dedicated passwordless confirmation screen (NOT the GIF loading screen)
    hideAllAuthSurfaces();

    const msg = document.getElementById("passwordless-confirm-message");
    if (msg) {
      const clean = (email || "").trim();
      msg.textContent = clean
        ? `We sent a secure log in link to ${clean}. Follow the secure link to log in without a password.`
        : "We sent a secure log in link. Follow the secure link to log in without a password.";
    }

    // Small delay to ensure Lottie player is ready, then show screen and play animation
    setTimeout(() => {
      if (passwordlessConfirmScreen) {
        passwordlessConfirmScreen.style.display = "flex";

        // Force Lottie animation to play from the beginning
        const lottiePlayer =
          passwordlessConfirmScreen.querySelector("lottie-player");
        if (lottiePlayer) {
          lottiePlayer.seek(0); // Reset to first frame
          lottiePlayer.play(); // Start playing
        }
      }
    }, 100);
  }

  function detectModeFromEmail(email) {
    return /pro/i.test(email) ? "pro" : "consumer";
  }

  function getSelectedThemeOverride() {
    const sel = document.getElementById("login-theme-select");
    if (!sel) return null;
    const v = sel.value?.toLowerCase();
    if (v === "pro" || v === "consumer") return v;
    return null;
  }

  function indicateLoading(btn, isLoading, text = "Signing in...") {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalText = btn.textContent;
      btn.classList.add("btn-loading");
      btn.textContent = text;
      btn.disabled = true;
    } else {
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
      }
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    }
  }

  function isValidEmailBasic(email) {
    const v = (email || "").trim();
    return v.length >= 3 && v.includes("@");
  }

  function doLogin(requirePassword) {
    const emailEl = document.getElementById("login-email");
    const passEl = document.getElementById("login-password");
    const loginBtnLocal = document.getElementById("login-btn");
    const email = (emailEl?.value || "").trim();
    const pass = (passEl?.value || "").trim();

    emailEl?.classList.remove("input-error");
    passEl?.classList.remove("input-error");

    if (!email || (requirePassword && !pass)) {
      if (!email && emailEl) emailEl.classList.add("input-error");
      if (requirePassword && !pass && passEl)
        passEl.classList.add("input-error");
      loginScreen?.classList.add("auth-shake");
      setTimeout(() => loginScreen?.classList.remove("auth-shake"), 500);
      return;
    }

    indicateLoading(loginBtnLocal, true);
    hideAllAuthSurfaces();
    successScreen && (successScreen.style.display = "flex");

    const inferred = detectModeFromEmail(email);
    const override = getSelectedThemeOverride();
    const mode = override || inferred;

    setTimeout(() => {
      successScreen && (successScreen.style.display = "none");
      indicateLoading(loginBtnLocal, false);
      showApp(mode);
    }, SUCCESS_ANIMATION_DURATION);
  }

  function doPasswordlessSend() {
    const emailEl = document.getElementById("passwordless-email");
    const errEl = document.getElementById("passwordless-error");
    const btn = document.getElementById("passwordless-send-btn");

    const email = (emailEl?.value || "").trim();
    emailEl?.classList.remove("input-error");

    if (errEl) {
      errEl.textContent = "";
      errEl.style.display = "none";
    }

    if (!isValidEmailBasic(email)) {
      emailEl?.classList.add("input-error");
      if (errEl) {
        errEl.textContent = "Please enter a valid email address.";
        errEl.style.display = "block";
      }
      return;
    }

    indicateLoading(btn, true, "Sending link...");
    // Prototype: simulate network latency
    setTimeout(() => {
      indicateLoading(btn, false);
      showPasswordlessConfirmation(email);
    }, 900);
  }

  function wireAuthEvents() {
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn && !loginBtn.dataset.authWired) {
      loginBtn.addEventListener("click", () => doLogin(true));
      loginBtn.dataset.authWired = "true";
    }

    // Update: passwordless entry button should open passwordless screen (not log in directly)
    const passwordlessEntryBtn = document.querySelector(
      ".login-no-password-btn"
    );
    if (passwordlessEntryBtn && !passwordlessEntryBtn.dataset.authWired) {
      passwordlessEntryBtn.addEventListener("click", showPasswordless);
      passwordlessEntryBtn.dataset.authWired = "true";
    }

    const skipBtn = document.getElementById("skip-btn");
    if (skipBtn && !skipBtn.dataset.authWired) {
      skipBtn.addEventListener("click", () => {
        hideAllAuthSurfaces();
        showApp("skip");
      });
      skipBtn.dataset.authWired = "true";
    }

    const createAccountBtn = document.getElementById("create-account-btn");
    if (
      createAccountBtn &&
      accountScreen &&
      !createAccountBtn.dataset.authWired
    ) {
      createAccountBtn.addEventListener("click", () => {
        hideAllAuthSurfaces();
        accountScreen.style.display = "flex";
      });
      createAccountBtn.dataset.authWired = "true";
    }

    // NEW: Account creation back button
    const accountBackBtn = document.getElementById("account-back-btn");
    if (accountBackBtn && !accountBackBtn.dataset.authWired) {
      accountBackBtn.addEventListener("click", showLogin);
      accountBackBtn.dataset.authWired = "true";
    }

    // Passwordless screen wiring
    const pwBack = document.getElementById("passwordless-back-btn");
    if (pwBack && !pwBack.dataset.authWired) {
      pwBack.addEventListener("click", showLogin);
      pwBack.dataset.authWired = "true";
    }

    const pwSend = document.getElementById("passwordless-send-btn");
    if (pwSend && !pwSend.dataset.authWired) {
      pwSend.addEventListener("click", doPasswordlessSend);
      pwSend.dataset.authWired = "true";
    }

    const pwCreate = document.getElementById("passwordless-create-account-btn");
    if (pwCreate && accountScreen && !pwCreate.dataset.authWired) {
      pwCreate.addEventListener("click", () => {
        hideAllAuthSurfaces();
        accountScreen.style.display = "flex";
      });
      pwCreate.dataset.authWired = "true";
    }

    // Passwordless confirm wiring
    const pwConfirmBack = document.getElementById(
      "passwordless-confirm-back-btn"
    );
    if (pwConfirmBack && !pwConfirmBack.dataset.authWired) {
      pwConfirmBack.addEventListener("click", showPasswordless);
      pwConfirmBack.dataset.authWired = "true";
    }

    const pwResend = document.getElementById("passwordless-resend-btn");
    if (pwResend && !pwResend.dataset.authWired) {
      pwResend.addEventListener("click", () => {
        // Simple prototype behavior: reuse whatever email is currently in the passwordless form
        const emailEl = document.getElementById("passwordless-email");
        const email = (emailEl?.value || "").trim();
        showPasswordlessConfirmation(email);
      });
      pwResend.dataset.authWired = "true";
    }

    // Enter key submits passwordless send
    const pwEmail = document.getElementById("passwordless-email");
    if (pwEmail && !pwEmail.dataset.authWired) {
      pwEmail.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doPasswordlessSend();
      });
      pwEmail.dataset.authWired = "true";
    }

    document.querySelectorAll("#account-login-btn").forEach((el) => {
      if (!el.dataset.authWired) {
        el.addEventListener("click", showLogin);
        el.dataset.authWired = "true";
      }
    });

    // Enter key submits standard login
    ["login-password", "login-email"].forEach((id) => {
      const fld = document.getElementById(id);
      if (fld && !fld.dataset.authWired) {
        fld.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            doLogin(true);
          }
        });
        fld.dataset.authWired = "true";
      }
    });
  }

  // Initial wiring
  wireAuthEvents();
  // Fallback: observe DOM in case auth elements injected later
  const mo = new MutationObserver(() => wireAuthEvents());
  mo.observe(document.body, { childList: true, subtree: true });

  window.__authUIWired = true;
})();

(function initArticleOverlayFeature() {
  function getArticleOverlay() {
    return (
      document.getElementById("article-overlay") ||
      document.querySelector(".article-overlay")
    );
  }
  function openArticleOverlay(data) {
    const overlay = getArticleOverlay();
    if (!overlay) {
      return;
    }
    if (data) {
      const h = overlay.querySelector(".article-headline");
      const d = overlay.querySelector(".article-deck");
      const img = overlay.querySelector(".article-image img");
      if (h && data.title) h.textContent = data.title;
      if (d && data.deck) d.textContent = data.deck;
      if (img && data.image) img.src = data.image;
    }
    overlay.classList.add("visible");
    overlay.style.display = "flex"; // override inline display:none
    updateBodyScrollLock();
    trapFocus(overlay);
  }
  function closeArticleOverlay() {
    const overlay = getArticleOverlay();
    if (!overlay) return;

    // Prevent double-triggering if already closing
    if (overlay.classList.contains("closing")) return;

    // Add closing class to trigger exit animation
    overlay.classList.add("closing");
    // Remove visible class immediately so it doesn't conflict
    overlay.classList.remove("visible");

    // Wait for 1s animation to complete before hiding
    setTimeout(() => {
      overlay.classList.remove("closing");
      overlay.style.display = "none";
      updateBodyScrollLock();
    }, 1000); // matches 1s animation duration in CSS
  }
  function trapFocus(scope) {
    const focusables = scope.querySelectorAll(
      'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();
    function handler(e) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === "Escape") {
        closeArticleOverlay();
      }
    }
    scope.addEventListener("keydown", handler, { once: true });
  }
  document.addEventListener("click", function (e) {
    const backOrClose = e.target.closest(
      "[data-close-article], [data-article-back], .article-back-btn, #article-back-btn, .article-overlay-back"
    );
    if (backOrClose) {
      e.preventDefault();
      closeArticleOverlay();
      return;
    }
    const card = e.target.closest(".news-card");
    if (card) {
      const data = {
        title:
          card.querySelector(".news-card-title")?.textContent?.trim() ||
          "Article",
        deck: card.querySelector(".news-card-deck")?.textContent?.trim() || "",
        image:
          card.querySelector(".news-card-image img")?.getAttribute("src") || "",
      };
      openArticleOverlay(data);
      if (currentLoginMode === "skip" && !isSkipExperience) {
        newsCardClickCount++;
        const skipEl = getSkipOverlay();
        if (!skipEl && newsCardClickCount >= 3) {
        }
        if (skipEl && newsCardClickCount >= 3) {
          skipEl.classList.add("visible");
          skipEl.style.display = "flex";
          isSkipExperience = true;
          updateBodyScrollLock();
          document.dispatchEvent(
            new CustomEvent("skipOverlayShown", {
              detail: { count: newsCardClickCount },
            })
          );
        }
      }
    }
  });
  document.addEventListener("mousedown", function (e) {
    const overlay = getArticleOverlay();
    if (!overlay || !overlay.classList.contains("visible")) return;
    if (e.target === overlay) closeArticleOverlay();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeArticleOverlay();
  });
})();

document.addEventListener("click", function (e) {
  const skipEl = getSkipOverlay();
  if (!skipEl || !skipEl.classList.contains("visible")) return;
  if (e.target.closest("[data-close-skip-overlay], .skip-overlay-close")) {
    skipEl.classList.remove("visible");
    skipEl.style.display = "none";
    updateBodyScrollLock();
  }
});

// Unified tool overlay/back behavior used by tools grid
(function toolOverlayAPI() {
  let currentToolId = null;
  function getToolOverlay() {
    return document.getElementById("tool-overlay");
  }
  function setToolOverlayContent(title, bodyHtml) {
    const overlay = getToolOverlay();
    if (!overlay) return;
    const titleEl = overlay.querySelector("#tool-overlay-title");
    const bodyEl = overlay.querySelector("#tool-overlay-body");
    if (titleEl) titleEl.textContent = title || "";
    if (bodyEl) bodyEl.innerHTML = bodyHtml || "";
  }
  function showToolOverlay() {
    const overlay = getToolOverlay();
    if (!overlay) return;
    overlay.style.display = "flex";
    overlay.classList.add("visible");
    updateBodyScrollLock?.();
  }
  function hideToolOverlay() {
    const overlay = getToolOverlay();
    if (!overlay) return;
    overlay.classList.remove("visible");
    overlay.style.display = "none";
    updateBodyScrollLock?.();
  }
  function mapTitle(id) {
    const map = {
      directories: "Directories",
      meeting: "Log a Meeting",
      legislation: "Legislation",
      calendar: "Calendar",
      analytics: "Mock Tool 1",
      settings: "Mock Tool 2",
    };
    return map[id] || (id ? id.charAt(0).toUpperCase() + id.slice(1) : "Tool");
  }
  function openTool(id) {
    currentToolId = id;
    try {
      ensureAppVisible();
    } catch (_) {}
    try {
      setTheme("pro");
    } catch (_) {}
    navigate("tools");
    if (id === "directories") {
      toggleSideOverlay?.(true);
      // keep hash in sync
      if (location.hash.toLowerCase() !== "#tool/directories") {
        location.hash = "#tool/directories";
      }
      return;
    }
    if (id === "meeting") {
      // Navigate to dedicated page for now
      location.href = "log-meeting.html";
      return;
    }
    // Fallback: simple placeholder overlay
    const title = mapTitle(id);
    const body = `
      <div class="placeholder-tool">
        <p>${title} is coming soon to this prototype.</p>
      </div>
    `;
    setToolOverlayContent(title, body);
    showToolOverlay();
    if (!/^#tool\//.test(location.hash)) {
      location.hash = `#tool/${id}`;
    }
  }
  function closeCurrentTool() {
    // Hide any tool surfaces
    hideToolOverlay();
    toggleSideOverlay?.(false);
    currentToolId = null;
  }
  function backToTools() {
    closeCurrentTool();
    navigate("tools");
    if (location.hash.toLowerCase() !== "#pro-tools") {
      location.hash = "#pro-tools";
    }
  }
  // Wire back button inside tool overlay
  function wireBackBtn() {
    const btn = document.getElementById("tool-overlay-back-btn");
    if (btn && !btn.dataset.wired) {
      btn.addEventListener("click", backToTools);
      btn.dataset.wired = "1";
    }
  }
  document.addEventListener("DOMContentLoaded", wireBackBtn);

  // Expose globally for inline handlers
  window.openTool = openTool;
  window.backToTools = backToTools;
  window.closeCurrentTool = closeCurrentTool;
})();

document.addEventListener("DOMContentLoaded", function () {
  const proto = document.querySelector(".prototype-screen");
  if (proto) {
    const dismissed = sessionStorage.getItem("prototypeDismissed");
    proto.style.display = dismissed ? "none" : "flex";
    const enterBtn = document.getElementById("enter-btn");
    if (enterBtn) {
      enterBtn.addEventListener("click", () => {
        proto.style.display = "none";
        sessionStorage.setItem("prototypeDismissed", "true");
      });
    }
  }
});

// Viewport height polyfill for mobile browser UI chrome (sets --vh)
(function viewportVHPolyfill() {
  function setViewportHeightVar() {
    try {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    } catch (_) {}
  }
  setViewportHeightVar();
  window.addEventListener("resize", setViewportHeightVar, { passive: true });
  window.addEventListener("orientationchange", setViewportHeightVar, {
    passive: true,
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) setViewportHeightVar();
  });
})();

// Inject desktop-only CSS for textareas (hide native resize handle)
function ensureTextareaCSS() {
  if (document.getElementById("auto-grow-textarea-css")) return;
  const style = document.createElement("style");
  style.id = "auto-grow-textarea-css";
  style.textContent = "@media (min-width:768px){textarea{resize:none;}}";
  document.head.appendChild(style);
}

// --- Auto-resize textareas (desktop: no native resize; JS grows as you type) ---
function autoResizeTextarea(el) {
  if (!el || !el.isConnected) return;
  // Skip measurement while hidden; it will run on input/focus or overlay transitions
  if (el.offsetParent === null) return;
  const cs = getComputedStyle(el);
  if (!el.dataset.initialHeight) {
    const h = parseFloat(cs.height) || el.clientHeight || 0;
    el.dataset.initialHeight = String(Math.max(0, h));
  }
  const minH = parseFloat(el.dataset.initialHeight) || 0;
  el.style.overflowY = "hidden"; // avoid inner scrollbars
  el.style.height = "auto"; // reset to recompute
  const next = Math.max(minH, el.scrollHeight);
  el.style.height = next + "px";
}
function initAutoResizeTextareas(root = document) {
  const areas = root.querySelectorAll("textarea:not([data-autoGrowWired])");
  areas.forEach((ta) => {
    ta.dataset.autoGrowWired = "1";
    const handler = () => requestAnimationFrame(() => autoResizeTextarea(ta));
    // Initialize once in case it has preset content
    requestAnimationFrame(() => autoResizeTextarea(ta));
    ["input", "change", "cut", "paste", "drop", "keydown", "focus"].forEach(
      (evt) => ta.addEventListener(evt, handler)
    );
  });
}
// Initialize on load and keep tidy on viewport changes
document.addEventListener("DOMContentLoaded", () => {
  ensureTextareaCSS();
  initAutoResizeTextareas();
  // Observe future DOM changes to auto-wire newly added textareas
  try {
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes &&
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return; // ELEMENT_NODE
            if (n.matches && n.matches("textarea")) {
              initAutoResizeTextareas(n.parentNode || document);
            } else if (n.querySelectorAll) {
              const tAreas = n.querySelectorAll("textarea");
              if (tAreas.length) initAutoResizeTextareas(n);
            }
          });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}
});
window.addEventListener("resize", () => initAutoResizeTextareas());
// Re-run when overlays finish sliding in (their size affects scrollHeight)
document.addEventListener("transitionend", (e) => {
  if (
    e.target &&
    (e.target.id === "addMeetingOverlay" ||
      e.target.id === "logMeetingOverlay" ||
      e.target.classList?.contains("edit-overlay") ||
      e.target.classList?.contains("side-overlay"))
  ) {
    initAutoResizeTextareas(e.target);
  }
});
// --- End auto-resize ---

// NEW: Lazy load state legislators only when needed
function ensureStateLegislatorsLoaded() {
  if (legislatorsLoaded) return;

  const startTime = performance.now();

  // Show loading indicator
  const list = document.querySelector(".people-list");
  if (list) {
    list.innerHTML = `
      <li class="person-suggestion loading-state">
        <div class="person-info">
          <span class="person-name">Loading state legislators...</span>
          <span class="person-role">This may take a moment</span>
        </div>
      </li>
    `;
  }

  // Use setTimeout to allow UI to update before heavy operation
  setTimeout(() => {
    // Merge legislators, avoiding duplicates
    legislators.forEach((leg) => {
      const key = `${leg.name}||${leg.role}`;
      if (!loadedLegislatorNames.has(key)) {
        people.push(leg);
        loadedLegislatorNames.add(key);
      }
    });

    legislatorsLoaded = true;
    const elapsed = performance.now() - startTime;

    // Immediately re-render with the new data
    renderPeopleList();
  }, 50);
}
