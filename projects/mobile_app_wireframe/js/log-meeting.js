// Minimal, production-ready wiring for Log a Meeting

function toggleLogMeetingOverlay(show) {
  // Support multiple accidental duplicate nodes with the same id
  const overlays = document.querySelectorAll("#logMeetingOverlay");
  if (!overlays || overlays.length === 0) return;
  overlays.forEach((overlay) => {
    if (show) {
      overlay.classList.add("visible");
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
      overlay.classList.remove("visible");
    }
  });
  if (typeof updateBodyScrollLock === "function") {
    updateBodyScrollLock();
  } else {
    const anyOpen = document.querySelector(
      "#bioOverlay.visible, #filterOverlay.visible, #logMeetingOverlay.visible"
    );
    document.body.classList.toggle("body-no-scroll", !!anyOpen);
  }
}

// Expose for other scripts that may open/close the overlay
window.toggleLogMeetingOverlay = toggleLogMeetingOverlay;

// Provide a no-op-safe global used by HTML onclick
window.backToTools = function () {
  try {
    toggleLogMeetingOverlay(false);
  } catch {}
};

function openPopupMenu(anchorEl, options, currentValue, onPick) {
  const current = (currentValue || "").trim();
  const menu = document.createElement("div");
  menu.className = "popup-menu";
  menu.setAttribute("role", "menu");
  menu.innerHTML = options
    .map(
      (label) => `
      <button class="popup-menu-item" role="menuitemradio" data-val="${label}" aria-checked="${
        label === current
      }">
        <span class="label">${label}</span>
        <span class="check">✓</span>
      </button>`
    )
    .join("");

  const rect = anchorEl.getBoundingClientRect();
  menu.style.position = "fixed";
  document.body.appendChild(menu);
  // Position menu pinned to the right with 17px gutter
  const top = Math.min(rect.bottom + 8, window.innerHeight - 12);
  menu.style.right = "17px";
  menu.style.left = "auto";
  menu.style.top = `${top}px`;

  const close = () => {
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey, true);
    if (menu.parentNode) menu.parentNode.removeChild(menu);
  };
  const onDocClick = (e) => {
    if (!menu.contains(e.target)) close();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onKey, true);

  menu.querySelectorAll(".popup-menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-val");
      if (typeof onPick === "function") onPick(val);
      close();
    });
  });
}

function openTypePicker(anchorEl, currentValue, onPick) {
  openPopupMenu(
    anchorEl,
    ["Virtual", "Phone", "In Person"],
    currentValue,
    onPick
  );
}

function pickNative(type, value, onChange) {
  const input = document.createElement("input");
  input.type = type; // "date" or "time"
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";
  input.value = value || "";
  document.body.appendChild(input);
  const cleanup = () => input.parentNode && input.parentNode.removeChild(input);
  input.addEventListener("change", () => {
    onChange(input.value);
    cleanup();
  });
  input.addEventListener("blur", cleanup, { once: true });
  input.showPicker ? input.showPicker() : input.click();
}

// Ensure date/time formatters exist before usage
function formatMeetingDate(d) {
  try {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return "";
  }
}
function formatMeetingTime(d) {
  try {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Parse a US numeric date like MM/DD/YYYY into a Date at local noon
function parseUS_MM_DD_YYYY(str) {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(str || "");
  if (!m) return null;
  const mm = parseInt(m[1], 10);
  const dd = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  return isNaN(d) ? null : d;
}

// Helpers to convert display labels to input-friendly values
function toISODateFromLabel(label) {
  try {
    if (!label) return "";
    // Prefer explicit MM/DD/YYYY parsing
    const parsed = parseUS_MM_DD_YYYY(label);
    if (parsed) {
      return localISODate(parsed);
    }
    const d = new Date(label);
    if (isNaN(d)) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  } catch {
    return "";
  }
}
function toHHmmFromDisplayTime(str) {
  try {
    if (!str) return "";
    const d = new Date(`1970-01-01 ${str}`);
    if (isNaN(d)) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

// Normalize any stored date label to the current display format
function normalizeDateLabel(str) {
  try {
    if (!str) return "";
    const d = parseUS_MM_DD_YYYY(str) || new Date(str);
    if (isNaN(d)) return str; // leave as-is if unparseable
    return formatMeetingDate(d);
  } catch {
    return str;
  }
}

// Helper to convert HH:mm to a user-facing time string like "10:00 AM"
function displayTimeFromHHmm(hhmm) {
  try {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return formatMeetingTime(d);
  } catch {
    return "";
  }
}
// Helper to build a single inline label from start/end HH:mm
function formatTimeRangeLabel(startHHmm, endHHmm) {
  const s = displayTimeFromHHmm(startHHmm);
  const e = displayTimeFromHHmm(endHHmm);
  if (!s && !e) return "—";
  if (s && e) return `${s} – ${e}`;
  return s || e || "—";
}

function syncInlineToEdit(root) {
  const typeInline =
    root.querySelector("#meetingTypeValue")?.textContent?.trim() || "Virtual";
  const edit = root.querySelector(".edit-overlay");
  if (!edit) return;
  // Type
  edit.querySelector("#editTypeValue").textContent = typeInline;
  edit.querySelector("#editType").value = typeInline;
  // Date: prefill from Add overlay chip if hidden is empty
  const dateHidden = edit.querySelector("#editDate");
  if (dateHidden && !dateHidden.value) {
    const addDateLabel = root
      .querySelector("#meetingDateValue")
      ?.textContent?.trim();
    if (addDateLabel) {
      const isoFromLabel = toISODateFromLabel(addDateLabel);
      if (isoFromLabel) dateHidden.value = isoFromLabel;
    }
    if (!dateHidden.value) {
      const now = new Date();
      dateHidden.value = localISODate(now);
    }
    const dv = edit.querySelector("#editDateValue");
    if (dv) {
      const d = parseISOToDate(dateHidden.value) || new Date();
      dv.textContent = formatMeetingDate(d);
    }
  }
  // Time: prefill from Add overlay single time chip (#meetingTimeValue) or leave as-is
  const timeLabel = root
    .querySelector("#meetingTimeValue")
    ?.textContent?.trim();
  const timeParts = (timeLabel || "")
    .split(/[–—-]/) // en/em dash or hyphen
    .map((s) => s.trim())
    .filter(Boolean);
  const fromLabelStart = timeParts[0]
    ? toHHmmFromDisplayTime(timeParts[0])
    : "";
  const fromLabelEnd = timeParts[1] ? toHHmmFromDisplayTime(timeParts[1]) : "";
  const startHidden = edit.querySelector("#editStart");
  const endHidden = edit.querySelector("#editEnd");
  if (startHidden) {
    if (!startHidden.value && fromLabelStart)
      startHidden.value = fromLabelStart;
    const sLbl = edit.querySelector("#editStartValue");
    if (sLbl)
      sLbl.textContent = startHidden.value
        ? displayTimeFromHHmm(startHidden.value)
        : "—";
  }
  if (endHidden) {
    if (!endHidden.value && fromLabelEnd) endHidden.value = fromLabelEnd;
    const eLbl = edit.querySelector("#editEndValue");
    if (eLbl)
      eLbl.textContent = endHidden.value
        ? displayTimeFromHHmm(endHidden.value)
        : "—";
  }
  // Location & Attendees placeholders -> prefill edit hidden values when present on Add overlay
  // Prefer new inline input for Location; fallback to legacy span if present
  const locChip = root.querySelector("#meetingLocationValue");
  const attChip = root.querySelector("#meetingAttendeesValue");
  const locVal = (locChip && locChip.textContent.trim()) || "";
  const attVal = (attChip && attChip.textContent.trim()) || "";
  const locHidden = edit.querySelector("#editLocation");
  const attHidden = edit.querySelector("#editAttendees");
  if (
    locHidden &&
    !locHidden.value &&
    locVal &&
    locVal.toLowerCase() !== "add"
  ) {
    locHidden.value = locVal;
    const ph = edit.querySelector("#editLocationPlaceholder");
    if (ph) ph.textContent = locVal;
  }
  if (
    attHidden &&
    !attHidden.value &&
    attVal &&
    attVal.toLowerCase() !== "add"
  ) {
    attHidden.value = attVal;
    const ph = edit.querySelector("#editAttendeesPlaceholder");
    if (ph) ph.textContent = attVal;
  }
  // Private switch
  const privChip = root.querySelector("#meetingPrivateValue");
  const privVal =
    (privChip && privChip.textContent.trim().toLowerCase()) || "off";
  const privSwitch = edit.querySelector("#editPrivate");
  if (privSwitch) privSwitch.checked = privVal === "on";
}

function saveEditToInline(root) {
  const edit = root.querySelector(".edit-overlay");
  if (!edit) return;
  const type = edit.querySelector("#editTypeValue").textContent.trim();
  const dateLabel = edit.querySelector("#editDateValue").textContent.trim();
  const startLabel = edit.querySelector("#editStartValue").textContent.trim();
  const endLabel = edit.querySelector("#editEndValue").textContent.trim();
  const isoDate = edit.querySelector("#editDate")?.value || "";
  const startHHmm = edit.querySelector("#editStart")?.value || "";
  const endHHmm = edit.querySelector("#editEnd")?.value || "";

  // Reflect to Add overlay inline chips
  const typeEl = root.querySelector("#meetingTypeValue");
  if (typeEl) typeEl.textContent = type;
  const dateEl = root.querySelector("#meetingDateValue");
  if (dateEl) dateEl.textContent = dateLabel;
  const timeEl = root.querySelector("#meetingTimeValue");
  if (timeEl) timeEl.textContent = formatTimeRangeLabel(startHHmm, endHHmm);
  // Location & Attendees
  const locVal = edit.querySelector("#editLocation")?.value || "";
  const attVal = edit.querySelector("#editAttendees")?.value || "";
  const locChip = root.querySelector("#meetingLocationValue");
  if (locChip) {
    locChip.textContent = locVal ? locVal : "Add";
    locChip.classList.toggle("placeholder", !locVal);
  }
  const attChip = root.querySelector("#meetingAttendeesValue");
  if (attChip) attChip.textContent = attVal ? attVal : "Add";
  // Private
  const privChecked = !!edit.querySelector("#editPrivate")?.checked;
  const privChip = root.querySelector("#meetingPrivateValue");
  if (privChip) privChip.textContent = privChecked ? "On" : "Off";

  // Sync hidden fields on Add overlay (values live in the edit overlay; keep ids consistent)
  const setVal = (sel, val = "") => {
    const el = root.querySelector(sel);
    if (el) el.value = val;
  };
  setVal("#editType", type);
  setVal("#editDate", isoDate);
  setVal("#editStart", startHHmm);
  setVal("#editEnd", endHHmm);
}

function computeDurationLabel(startHHmm, endHHmm) {
  if (!startHHmm || !endHHmm) return "—";
  const [sh, sm] = startHHmm.split(":").map((n) => parseInt(n, 10));
  const [eh, em] = endHHmm.split(":").map((n) => parseInt(n, 10));
  if (
    Number.isNaN(sh) ||
    Number.isNaN(sm) ||
    Number.isNaN(eh) ||
    Number.isNaN(em)
  )
    return "—";
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60; // cross midnight safeguard
  const mins = end - start;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return "0m";
}

// Update rating UI, hidden value, ARIA, and score text
function setRatingUI(addOverlay, value) {
  if (!addOverlay) return;
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const hidden = addOverlay.querySelector("#meetingRatingValue");
  if (hidden) hidden.value = String(v);

  const stars = addOverlay.querySelectorAll(".rating-section .rating-star");
  const focusIndex = v > 0 ? v - 1 : 0;
  stars.forEach((btn, idx) => {
    const active = idx < v;
    btn.classList.toggle("active", active);
    btn.setAttribute("role", "radio");
    // Only the selected radio should be aria-checked=true; none if v==0
    const isSelected = v > 0 && idx === v - 1;
    btn.setAttribute("aria-checked", isSelected ? "true" : "false");
    btn.setAttribute("tabindex", idx === focusIndex ? "0" : "-1");
  });
  const score = addOverlay.querySelector("#ratingScoreValue");
  if (score) score.textContent = String(v);
}

// === Tags & Attachments helpers ===
function escapeHTML(s) {
  const div = document.createElement("div");
  div.textContent = s || "";
  return div.innerHTML;
}
function parseCSVList(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Robust hidden setter: attribute + inline style
function setHidden(el, isHidden) {
  if (!el) return;
  el.hidden = !!isHidden;
  el.style.display = isHidden ? "none" : "";
}

function renderTagsList(addOverlay, tagsArr) {
  if (!addOverlay) return;
  const list = addOverlay.querySelector("#tagsList");
  const hidden = addOverlay.querySelector("#editTags");
  const addBtn = addOverlay.querySelector("#addTagsBtn");
  const editBtn = addOverlay.querySelector("#editTagsBtn");
  const section = addOverlay.querySelector(".tags-section");
  if (hidden) hidden.value = (tagsArr || []).join(", ");
  if (!list) return;
  // Render inline chips with remove buttons
  list.innerHTML = (tagsArr || [])
    .map(
      (t) =>
        `<span class="tag-chip"><span class="label">${escapeHTML(
          t
        )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
          t
        )}">×</button></span>`
    )
    .join("");
  const has = !!(tagsArr && tagsArr.length);
  setHidden(list, !has);
  setHidden(addBtn, has);
  setHidden(editBtn, !has);
  setHidden(section, !has);
}

function renderAttachmentsList(addOverlay, namesArr) {
  if (!addOverlay) return;
  const list = addOverlay.querySelector("#attachmentsList");
  const hidden = addOverlay.querySelector("#editAttachments");
  const addBtn = addOverlay.querySelector("#addAttachmentsBtn");
  const editBtn = addOverlay.querySelector("#editAttachmentsBtn");
  const section = addOverlay.querySelector(".attachments-section");
  if (hidden) hidden.value = (namesArr || []).join(", ");
  if (!list) return;
  list.innerHTML = (namesArr || [])
    .map(
      (n) =>
        `<li class="attachment-item"><span class="name">${escapeHTML(
          n
        )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
          n
        )}">Remove</button></li>`
    )
    .join("");
  const has = !!(namesArr && namesArr.length);
  setHidden(list, !has);
  setHidden(addBtn, has);
  setHidden(editBtn, !has);
  setHidden(section, !has);
}

// Open Tags bottom sheet overlay (updated)
function openTagsOverlay(root) {
  const sheet = root.querySelector(".tags-overlay");
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!sheet || !addOverlay) return;
  // Ensure Recently used has initial chips
  seedRecentTagsIfEmpty();
  const selectedArr = (addOverlay.querySelector("#editTags")?.value || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  tagsOverlay_setSelectedSet(sheet, new Set(selectedArr));
  const search = sheet.querySelector("#taTagSearch");
  if (search) search.value = "";
  tagsOverlay_renderRecent(sheet);
  tagsOverlay_renderOptions(sheet, undefined, "");
  sheet.classList.add("visible");
  sheet.classList.remove("hidden");
  setTimeout(() => search && search.focus && search.focus(), 50);
}

function openAttachmentsOverlay(root) {
  const sheet = root.querySelector(".attachments-overlay");
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!sheet || !addOverlay) return;
  const files = parseCSVList(
    addOverlay.querySelector("#editAttachments")?.value || ""
  );
  const list = sheet.querySelector("#attFilesList");
  if (list) {
    list.innerHTML = (files || [])
      .map(
        (n) =>
          `<li class="attachment-item"><span class="name">${escapeHTML(
            n
          )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
            n
          )}">Remove</button></li>`
      )
      .join("");
  }
  sheet.classList.add("visible");
  sheet.classList.remove("hidden");
  const btn = sheet.querySelector("#attAddFilesBtn");
  if (btn && btn.click) setTimeout(() => btn.click(), 50);
}

function getMeetingTypeIconSVG(typeLabel) {
  const t = String(typeLabel || "").toLowerCase();
  if (t === "phone" || t === "call" || t.includes("phone")) {
    return '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g clip-path="url(#clip0_phone_12)"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.37692 9.01873C1.48423 9.22637 1.68576 9.55339 2.04615 9.96217C2.4406 10.4096 2.72485 10.6326 2.87912 10.7356C3.54883 10.4979 5.8091 9.59525 7.75482 7.64953C9.62965 5.7747 10.5077 3.49401 10.7712 2.70288C10.5601 2.5091 10.2114 2.19905 9.78269 1.85485C9.46746 1.60175 9.22313 1.43996 9.05518 1.34048L7.34714 3.04852L8.549 3.84165C8.77476 3.99064 8.90449 4.31021 8.7471 4.60653C8.61229 4.86034 8.1937 5.49982 6.8994 6.79411C5.63499 8.05853 4.99752 8.61604 4.77072 8.80602C4.48519 9.04519 4.06833 8.96338 3.88121 8.66333L3.05585 7.33981L1.37692 9.01873ZM0.332317 9.1255C0.250014 8.89452 0.322992 8.65845 0.472723 8.50872L2.70465 6.27679C2.97766 6.00378 3.43373 6.05595 3.63803 6.38356L4.47923 7.73246C4.81328 7.43122 5.36314 6.91617 6.1923 6.08701C7.00502 5.27428 7.43561 4.75348 7.65746 4.45143L6.38715 3.61313C6.07018 3.40395 6.02482 2.95662 6.29337 2.68808L8.55986 0.421583C8.7222 0.259242 8.98158 0.191352 9.22059 0.29841C9.3986 0.378144 9.80393 0.589466 10.4088 1.07508C11.0371 1.57955 11.502 2.01435 11.6442 2.14984C11.7973 2.29566 11.872 2.52189 11.8055 2.74781C11.6743 3.19392 10.7728 6.04581 8.46193 8.35664C6.11361 10.705 3.35754 11.6358 3.01357 11.7459C2.88424 11.7873 2.73286 11.7862 2.59051 11.7204C2.40646 11.6354 1.95562 11.3716 1.29605 10.6235C0.651471 9.89237 0.410133 9.34389 0.332317 9.1255Z" fill="#3C3C43" fill-opacity="0.6"/></g><defs><clipPath id="clip0_phone_12"><rect width="12" height="12" fill="white"/></clipPath></defs></svg>';
  }
  if (
    t === "in person" ||
    t === "in-person" ||
    t === "person" ||
    t.includes("person")
  ) {
    return '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g clip-path="url(#clip0_inperson_12)"><path d="M6.21826 6C6.21826 5.58579 5.88248 5.25 5.46826 5.25C5.05405 5.25 4.71826 5.58579 4.71826 6C4.71826 6.41421 5.05405 6.75 5.46826 6.75C5.88248 6.75 6.21826 6.41421 6.21826 6Z" fill="#3C3C43" fill-opacity="0.6"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11 11V2H8V0H1V11H0V12H8.00244V11H8V3H10V11L9.99463 12H12V11H11ZM7 1H2V11H7V1Z" fill="#3C3C43" fill-opacity="0.6"/></g><defs><clipPath id="clip0_inperson_12"><rect width="12" height="12" fill="white"/></clipPath></defs></svg>';
  }
  // default Virtual
  return '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g clip-path="url(#clip0_virtual_12)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 9H5.5V11H2V12H10V11H6.5V9H12V0H0V9ZM11 1H1V8H11V1Z" fill="#3C3C43" fill-opacity="0.6"/></g><defs><clipPath id="clip0_virtual_12"><rect width="12" height="12" fill="white"/></clipPath></defs></svg>';
}

function meetingCardHTML({
  title,
  type,
  typeLabel,
  dateLabel,
  durationLabel,
  pinned,
}) {
  const pressed = pinned ? "true" : "false";
  const tLabel = typeLabel || type || "Virtual";
  return `
    <div class="meeting-card" ${pinned ? 'data-pinned="true"' : ""}>
      <div class="title-row">
        <div class="meeting-title">${title}</div>
        <button class="icon-btn pin-btn" type="button" aria-label="Pin meeting" aria-pressed="${pressed}">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <path d="M12.8332 14.1666V1.83325H3.1665V14.1666L7.99984 11.4999L12.8332 14.1666Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </div>
      <div class="meta-list">
        <div class="meta-item" aria-label="Meeting type">
          ${getMeetingTypeIconSVG(tLabel)}
          <span>${tLabel}</span>
        </div>
        <div class="meta-item" aria-label="Meeting date">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.5"/><path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>${dateLabel}</span>
        </div>
        <div class="meta-item" aria-label="Meeting duration">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>${durationLabel}</span>
        </div>
      </div>
    </div>`;
}

function setCardPinnedUI(cardEl, pinned) {
  cardEl.dataset.pinned = pinned ? "true" : "false";
  const btn = cardEl.querySelector(".pin-btn");
  if (btn) btn.setAttribute("aria-pressed", pinned ? "true" : "false");
}

function updateMeetingPinned(id, pinned) {
  const arr = readMeetings();
  const i = arr.findIndex((m) => m.id === id);
  if (i >= 0) {
    arr[i].pinned = !!pinned;
    writeMeetings(arr);
  }
}

function ensureCardId(cardEl) {
  if (!cardEl.dataset.cardId) {
    cardEl.dataset.cardId = `m_${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}`;
  }
  return cardEl.dataset.cardId;
}

const STORAGE_KEY = "logMeeting.meetings";
function readMeetings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeMeetings(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}
function upsertMeetingObj(obj) {
  const arr = readMeetings();
  const i = arr.findIndex((m) => m.id === obj.id);
  if (i >= 0) arr[i] = obj;
  else arr.unshift(obj);
  writeMeetings(arr);
}
// Remove a meeting by id from storage
function deleteMeetingById(id) {
  try {
    const arr = readMeetings();
    const next = arr.filter((m) => m.id !== id);
    writeMeetings(next);
    return arr.length !== next.length;
  } catch (e) {
    return false;
  }
}
function renderStoredMeetings(root) {
  const pinnedList = root.querySelector(".meeting-logs.pinned-meetings");
  const recent = root.querySelector(".meeting-logs.recent-meetings");
  if (!recent) return;
  const arr = readMeetings();
  arr.forEach((m) => {
    const tmp = document.createElement("div");
    const durationLabel = m.duration || computeDurationLabel(m.start, m.end);
    const dateLabel = normalizeDateLabel(m.date || "");
    tmp.innerHTML = meetingCardHTML({
      title: m.title || "Untitled Meeting",
      type: m.type || "Virtual",
      dateLabel: dateLabel,
      durationLabel: durationLabel || "—",
      pinned: !!m.pinned,
    });
    const card = tmp.firstElementChild; // .meeting-card
    card.dataset.cardId = m.id;
    card.dataset.title = m.title || "";
    if (m.type) card.dataset.type = m.type;
    if (dateLabel) card.dataset.date = dateLabel;
    if (m.start) card.dataset.start = m.start;
    if (m.end) card.dataset.end = m.end;
    if (durationLabel) card.dataset.duration = durationLabel;
    if (m.location) card.dataset.location = m.location;
    if (m.attendees) card.dataset.attendees = m.attendees;
    if (m.priority) card.dataset.priority = m.priority;
    if (m.status) card.dataset.status = m.status;
    if (m.due) card.dataset.due = m.due;
    if (m.assigned) card.dataset.assigned = m.assigned;
    if (m.private != null) card.dataset.private = m.private ? "true" : "false";
    if (m.notes) card.dataset.notes = m.notes;
    if (m.rating != null) card.dataset.rating = String(m.rating);
    if (m.pinned) card.dataset.pinned = "true";
    if (m.tags) card.dataset.tags = m.tags;
    if (m.attachments) card.dataset.attachments = m.attachments;
    (m.pinned && pinnedList ? pinnedList : recent).appendChild(card);
  });
  updateEmptyStates(root);
}

function saveMeetingFromForm(root, opts) {
  opts = opts || {};
  const closeOverlay = opts.closeOverlay !== false; // default true
  const reapplyFilter = opts.reapplyFilter !== false; // default true
  const resort = opts.resort !== false; // default true
  const addOverlay = root.querySelector("#addMeetingOverlay");
  const editingId = addOverlay ? addOverlay.dataset.editingCardId : "";

  const title =
    root.querySelector("#meetingTitle")?.value?.trim() || "Untitled Meeting";
  // Prefer hidden edit values so autosave captures Edit overlay changes
  const typeHidden = root.querySelector("#editType")?.value?.trim() || "";
  const typeLabel =
    typeHidden ||
    root.querySelector("#meetingTypeValue")?.textContent?.trim() ||
    "Virtual";
  const isoFromHidden = root.querySelector("#editDate")?.value || "";
  let dateLabel = "";
  if (isoFromHidden) {
    const d = parseISOToDate(isoFromHidden);
    dateLabel = d ? formatMeetingDate(d) : "";
  }
  if (!dateLabel) {
    dateLabel =
      root.querySelector("#meetingDateValue")?.textContent?.trim() || "";
    if (!dateLabel) {
      const now = new Date();
      dateLabel = formatMeetingDate(now);
    }
  }
  const startHHmm = root.querySelector("#editStart")?.value || "";
  const endHHmm = root.querySelector("#editEnd")?.value || "";
  const durationLabel = computeDurationLabel(startHHmm, endHHmm);
  const locationVal = root.querySelector("#editLocation")?.value || "";
  const attendeesVal = root.querySelector("#editAttendees")?.value || "";
  const priorityChip = root.querySelector(
    '.meta-chip[data-meta="priority"] .chip-value'
  );
  const statusChip = root.querySelector(
    '.meta-chip[data-meta="status"] .chip-value'
  );
  const dueChip = root.querySelector('.meta-chip[data-meta="due"] .chip-value');
  const assignedChip = root.querySelector(
    '.meta-chip[data-meta="assigned"] .chip-value'
  );
  const ratingVal =
    parseInt(root.querySelector("#meetingRatingValue")?.value || "0", 10) || 0;
  const priorityVal =
    priorityChip && !priorityChip.classList.contains("placeholder")
      ? priorityChip.textContent.trim()
      : "";
  const statusVal =
    statusChip && !statusChip.classList.contains("placeholder")
      ? statusChip.textContent.trim()
      : "";
  const dueVal =
    dueChip && !dueChip.classList.contains("placeholder")
      ? dueChip.textContent.trim()
      : "";
  const assignedVal =
    assignedChip && !assignedChip.classList.contains("placeholder")
      ? assignedChip.textContent.trim()
      : "";
  // Private: prefer edit overlay switch if present; fallback to inline chip value
  const privSwitch = root.querySelector("#editPrivate");
  const chipIsOn =
    (root.querySelector("#meetingPrivateValue")?.textContent || "")
      .trim()
      .toLowerCase() === "on";
  const privateVal = privSwitch ? !!privSwitch.checked : chipIsOn;
  const notesVal = (
    root.querySelector("#detailedNotes")?.value ||
    root.querySelector("#quickNotes")?.value ||
    ""
  ).trim();
  const tagsVal = root.querySelector("#editTags")?.value?.trim() || "";
  const attachmentsVal =
    root.querySelector("#editAttachments")?.value?.trim() || "";

  const renderIntoCard = (cardEl, pinnedArg) => {
    // Update datasets for details/prefill first
    cardEl.dataset.title = title;
    cardEl.dataset.type = typeLabel;
    cardEl.dataset.date = dateLabel;
    if (startHHmm) cardEl.dataset.start = startHHmm;
    else delete cardEl.dataset.start;
    if (endHHmm) cardEl.dataset.end = endHHmm;
    else delete cardEl.dataset.end;
    if (durationLabel) cardEl.dataset.duration = durationLabel;
    else delete cardEl.dataset.duration;
    if (locationVal) cardEl.dataset.location = locationVal;
    else delete cardEl.dataset.location;
    if (attendeesVal) cardEl.dataset.attendees = attendeesVal;
    else delete cardEl.dataset.attendees;
    if (priorityVal) cardEl.dataset.priority = priorityVal;
    else delete cardEl.dataset.priority;
    if (statusVal) cardEl.dataset.status = statusVal;
    else delete cardEl.dataset.status;
    if (dueVal) cardEl.dataset.due = dueVal;
    else delete cardEl.dataset.due;
    if (assignedVal) cardEl.dataset.assigned = assignedVal;
    else delete cardEl.dataset.assigned;
    if (notesVal) cardEl.dataset.notes = notesVal;
    else delete cardEl.dataset.notes;
    cardEl.dataset.rating = String(ratingVal);
    cardEl.dataset.private = privateVal ? "true" : "false";
    if (tagsVal) cardEl.dataset.tags = tagsVal;
    else delete cardEl.dataset.tags;
    if (attachmentsVal) cardEl.dataset.attachments = attachmentsVal;

    // Try to update existing nodes without clobbering the entire card
    const titleNode = cardEl.querySelector(".meeting-title");
    if (titleNode) titleNode.textContent = title;
    const typeNode =
      cardEl.querySelector('[data-field="type"]') ||
      cardEl.querySelector('.meta-item[aria-label="Meeting type"] span');
    if (typeNode) typeNode.textContent = typeLabel;
    // Ensure type icon matches current type
    const typeMeta = cardEl.querySelector(
      '.meta-item[aria-label="Meeting type"]'
    );
    if (typeMeta) {
      typeMeta.innerHTML = `${getMeetingTypeIconSVG(
        typeLabel
      )}<span>${typeLabel}</span>`;
    }
    const dateNode =
      cardEl.querySelector('[data-field="date"]') ||
      cardEl.querySelector('.meta-item[aria-label="Meeting date"] span');
    if (dateNode) dateNode.textContent = dateLabel;
    const durationNode =
      cardEl.querySelector('[data-field="duration"]') ||
      cardEl.querySelector('.meta-item[aria-label="Meeting duration"] span');
    if (durationNode) durationNode.textContent = durationLabel || "—";

    // If key nodes are missing, rebuild innerHTML as a fallback only
    if (!titleNode || !typeNode || !dateNode || !durationNode) {
      const tmp = document.createElement("div");
      tmp.innerHTML = meetingCardHTML({
        title,
        typeLabel,
        dateLabel,
        durationLabel,
        pinned: !!pinnedArg,
      });
      const newInner = tmp.firstElementChild;
      cardEl.innerHTML = newInner.innerHTML;
    }

    // Ensure pin UI matches state
    setCardPinnedUI(cardEl, !!pinnedArg);
  };

  if (editingId) {
    // Update existing card
    const card = root.querySelector(
      `.meeting-card[data-card-id="${editingId}"]`
    );
    if (card) {
      const pinnedNow = card.dataset.pinned === "true";
      renderIntoCard(card, pinnedNow);
      const obj = {
        id: ensureCardId(card),
        title,
        type: typeLabel,
        date: dateLabel,
        start: startHHmm || "",
        end: endHHmm || "",
        duration: durationLabel || "",
        location: locationVal,
        attendees: attendeesVal,
        priority: priorityVal,
        status: statusVal,
        due: dueVal,
        assigned: assignedVal,
        notes: notesVal,
        rating: ratingVal,
        private: privateVal,
        pinned: pinnedNow,
        tags: tagsVal,
        attachments: attachmentsVal,
      };
      upsertMeetingObj(obj);
      if (addOverlay) addOverlay.dataset.editingCardId = obj.id;
    }
  } else {
    // Create new card in Recent
    const recent = root.querySelector(".meeting-logs.recent-meetings");
    if (recent) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = meetingCardHTML({
        title,
        typeLabel,
        dateLabel,
        durationLabel,
        pinned: false,
      });
      const cardEl = wrapper.firstElementChild;
      ensureCardId(cardEl);
      renderIntoCard(cardEl, false);
      // Use prepend only if we are closing (final save). For autosave keep position to reduce jank
      if (closeOverlay) recent.prepend(cardEl);
      else recent.insertBefore(cardEl, recent.firstChild);
      const obj = {
        id: ensureCardId(cardEl),
        title,
        type: typeLabel,
        date: dateLabel,
        start: startHHmm || "",
        end: endHHmm || "",
        duration: durationLabel || "",
        location: locationVal,
        attendees: attendeesVal,
        priority: priorityVal,
        status: statusVal,
        due: dueVal,
        assigned: assignedVal,
        notes: notesVal,
        rating: ratingVal,
        private: privateVal,
        pinned: false,
        tags: tagsVal,
        attachments: attachmentsVal,
      };
      upsertMeetingObj(obj);
      if (addOverlay) addOverlay.dataset.editingCardId = obj.id;
    }
  }

  // Optionally close the add overlay and clear edit target
  if (closeOverlay && addOverlay) {
    addOverlay.classList.remove("visible");
    addOverlay.classList.add("hidden");
    delete addOverlay.dataset.editingCardId;
    if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
    // Reset for the next creation
    try {
      resetAddMeetingOverlay(addOverlay);
    } catch {}
  }

  // Optionally reapply any active search filter and sort
  if (reapplyFilter) applyMeetingsSearchFilter(root);
  if (resort) {
    const sortSel = root.querySelector("#recentSort");
    if (sortSel) sortRecentList(root, sortSel.value || "newest");
  }
}

function setPriorityChipClassOnOverlay(overlayRoot, priorityValue) {
  const chip = overlayRoot.querySelector('.meta-chip[data-meta="priority"]');
  if (!chip) return;
  chip.classList.remove("prio-high", "prio-medium", "prio-low");
  const v = (priorityValue || "").toLowerCase();
  if (v === "high") chip.classList.add("prio-high");
  else if (v === "medium") chip.classList.add("prio-medium");
  else if (v === "low") chip.classList.add("prio-low");
}

function openAddOverlayPrefilledFromCard(root, cardEl) {
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!addOverlay) return;
  const id = ensureCardId(cardEl);
  addOverlay.dataset.editingCardId = id;
  const titleEl = root.querySelector("#meetingTitle");
  const typeEl = root.querySelector("#meetingTypeValue");
  const timeLabelEl = root.querySelector("#meetingTimeValue");
  const dateLabelEl = root.querySelector("#meetingDateValue");
  const startHidden = root.querySelector("#editStart");
  const endHidden = root.querySelector("#editEnd");
  const dateHidden = root.querySelector("#editDate");

  if (titleEl) titleEl.value = cardEl.dataset.title || "";
  if (typeEl) typeEl.textContent = cardEl.dataset.type || "Virtual";
  // Update inline Meeting type icon to reflect current type
  try {
    const t = cardEl.dataset.type || "Virtual";
    updateTypeIconsUI(root, t);
  } catch {}
  // Date
  const dLabel = cardEl.dataset.date || "";
  if (dateHidden)
    dateHidden.value = toISODateFromLabel(dLabel) || localISODate(new Date());
  if (dateLabelEl)
    dateLabelEl.textContent = dLabel || formatMeetingDate(new Date());
  // Times
  const sHHmm = cardEl.dataset.start || "";
  const eHHmm = cardEl.dataset.end || "";
  if (startHidden) startHidden.value = sHHmm;
  if (endHidden) endHidden.value = eHHmm;
  if (timeLabelEl) timeLabelEl.textContent = formatTimeRangeLabel(sHHmm, eHHmm);
  // Location -> display-only chip
  const locChip = addOverlay.querySelector("#meetingLocationValue");
  const locVal = cardEl.dataset.location || "";
  if (locChip) {
    locChip.textContent = locVal ? locVal : "Add";
    locChip.classList.toggle("placeholder", !locVal);
  }

  // Tags, Attachments, Notes -> restore into Add overlay
  if (addOverlay) {
    const tagsCSV = cardEl.dataset.tags || "";
    const attCSV = cardEl.dataset.attachments || "";
    const tagsArr = parseCSVList(tagsCSV);
    const attArr = parseCSVList(attCSV);
    const tagsHidden = addOverlay.querySelector("#editTags");
    if (tagsHidden) tagsHidden.value = (tagsArr || []).join(", ");
    const attHidden = addOverlay.querySelector("#editAttachments");
    if (attHidden) attHidden.value = (attArr || []).join(", ");
    renderTagsList(addOverlay, tagsArr);
    renderAttachmentsList(addOverlay, attArr);
    toggleAddButtonsByList(addOverlay);

    // Notes -> restore into quick and detailed note cards so they show immediately
    const savedNotes = cardEl.dataset.notes || "";
    const qn = addOverlay.querySelector("#quickNotes");
    const dn = addOverlay.querySelector("#detailedNotes");
    if (qn) qn.value = savedNotes;
    if (dn) dn.value = savedNotes;
    // Update counters if present
    const updateCounter = (id) => {
      const ta = addOverlay.querySelector(`#${id}`);
      const counter = addOverlay.querySelector(
        `.char-counter[data-for="${id}"]`
      );
      if (!ta || !counter) return;
      const max = parseInt(ta.getAttribute("data-max") || "0", 10);
      if (max)
        counter.textContent = `${Math.max(
          0,
          max - (ta.value || "").length
        )} Characters left`;
    };
    updateCounter("quickNotes");
    updateCounter("detailedNotes");
    // Reflect Follow Up visibility based on notes
    syncAddInlineUI(addOverlay);

    // Restore Follow Up chips (priority, status, due, assigned) from the card dataset
    const setChip = (meta, value, placeholder) => {
      const chipVal = addOverlay.querySelector(
        `.meta-chip[data-meta="${meta}"] .chip-value`
      );
      if (!chipVal) return;
      if (value) {
        chipVal.textContent = value;
        chipVal.classList.remove("placeholder");
      } else {
        chipVal.textContent = placeholder;
        chipVal.classList.add("placeholder");
      }
    };
    const pr = cardEl.dataset.priority || "";
    const st = cardEl.dataset.status || "";
    const dueLabel = cardEl.dataset.due || "";
    const asg = cardEl.dataset.assigned || "";
    setChip("priority", pr, "Priority");
    setPriorityChipClassOnOverlay(addOverlay, pr);
    setChip("status", st, "Status");
    setChip("due", dueLabel, "Due");
    setChip("assigned", asg, "Assigned");

    // Restore rating (meeting score)
    const savedRating = parseInt(cardEl.dataset.rating || "0", 10) || 0;
    setRatingUI(addOverlay, savedRating);

    // Show Follow Up card when any chip has a value or notes exist
    const hasMeta = !!(
      pr ||
      st ||
      dueLabel ||
      asg ||
      (savedNotes || "").trim()
    );
    const fCard = addOverlay.querySelector("#followUpCard");
    const addBtn = addOverlay.querySelector("#addFollowUpBtn");
    setHidden(fCard, !hasMeta);
    setHidden(addBtn, hasMeta);
  }

  // Show Add overlay
  addOverlay.classList.add("visible");
  addOverlay.classList.remove("hidden");
  if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
}

// Restore meetings search filter and wiring
function applyMeetingsSearchFilter(root) {
  const input = root.querySelector("#meetingsSearch");
  if (!input) return;
  const q = (input.value || "").toLowerCase().trim();
  const lists = root.querySelectorAll(".meeting-logs");
  lists.forEach((list) => {
    const cards = list.querySelectorAll(".meeting-card");
    cards.forEach((card) => {
      if (!q) {
        card.style.display = "";
        return;
      }
      const haystack = [
        card.dataset.title || "",
        card.dataset.type || "",
        card.dataset.date || "",
        card.dataset.duration || "",
        card.dataset.location || "",
        card.dataset.attendees || "",
        card.dataset.priority || "",
        card.dataset.status || "",
        card.dataset.due || "",
        card.dataset.assigned || "",
        card.dataset.private === "true" ? "private" : "",
        card.dataset.rating || "",
        card.dataset.tags || "",
        card.dataset.attachments || "",
        card.innerText || "",
      ]
        .join(" ")
        .toLowerCase();
      card.style.display = haystack.includes(q) ? "" : "none";
    });
  });
  const field = root.querySelector(".search-field");
  if (field) field.classList.toggle("has-value", !!q);
  updateEmptyStates(root);
}
function wireSearchField(root) {
  const input = root.querySelector("#meetingsSearch");
  const clearBtn = root.querySelector(".search-field .clear-btn");
  if (!input) return;
  input.addEventListener("input", () => applyMeetingsSearchFilter(root));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      applyMeetingsSearchFilter(root);
      e.stopPropagation();
      e.preventDefault();
    }
  });
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      applyMeetingsSearchFilter(root);
      input.focus();
    });
  }
}

// Round a Date object minutes to the nearest step and return HH:mm string
function toHHmmRounded(date, stepMinutes = 5) {
  const d = new Date(date);
  const mins = d.getMinutes();
  const rounded = Math.round(mins / stepMinutes) * stepMinutes;
  d.setMinutes(rounded, 0, 0);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Empty-state toggling based on visible cards
function updateEmptyStates(root) {
  const lists = root.querySelectorAll(".meeting-logs");
  lists.forEach((list) => {
    const empty = list.querySelector(".empty-state");
    if (!empty) return;
    const hasVisibleCard = Array.from(
      list.querySelectorAll(".meeting-card")
    ).some((c) => c.style.display !== "none");
    empty.style.display = hasVisibleCard ? "none" : "";
  });
}

// Parse card dataset into timestamp for sorting
function parseCardDateTime(cardEl) {
  try {
    const label = cardEl.dataset.date || "";
    if (!label) return 0;
    let d = parseUS_MM_DD_YYYY(label);
    if (!d) d = new Date(label);
    if (isNaN(d)) return 0;
    const start = cardEl.dataset.start || "";
    if (start) {
      const [h, m] = start.split(":").map((n) => parseInt(n || "0", 10));
      d.setHours(h || 0, m || 0, 0, 0);
    }
    return d.getTime();
  } catch {
    return 0;
  }
}

// Sort the Recent Meetings list in-place
function sortRecentList(root, mode) {
  const list = root.querySelector(".meeting-logs.recent-meetings");
  if (!list) return;
  const cards = Array.from(list.querySelectorAll(".meeting-card"));
  const byNewest = (a, b) => parseCardDateTime(b) - parseCardDateTime(a);
  const byOldest = (a, b) => parseCardDateTime(a) - parseCardDateTime(b);
  const byRating = (a, b) =>
    (parseInt(b.dataset.rating || "0", 10) || 0) -
    (parseInt(a.dataset.rating || "0", 10) || 0);
  const cmp =
    mode === "oldest" ? byOldest : mode === "rating" ? byRating : byNewest;
  cards.sort(cmp).forEach((c) => list.appendChild(c));
  updateEmptyStates(root);
}

// ===== Custom inline Date/Time Picker (Edit overlay) =====
function pad2(n) {
  return String(n).padStart(2, "0");
}
function localISODate(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function monthMatrix(y, m) {
  // Monday as first day of week
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7; // Mon=0
  const out = [];
  let day = 1 - start;
  for (let r = 0; r < 6; r++) {
    const week = [];
    for (let c = 0; c < 7; c++) week.push(new Date(y, m, day++));
    out.push(week);
  }
  return out.flat();
}
function parseISOToDate(iso) {
  try {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  } catch {
    return null;
  }
}

function editDTP_getSelectedDate(edit) {
  const iso = edit.querySelector("#editDate")?.value || "";
  return parseISOToDate(iso) || new Date();
}
function editDTP_setSelectedDate(edit, dateObj) {
  const iso = localISODate(dateObj);
  const hidden = edit.querySelector("#editDate");
  if (hidden) hidden.value = iso;
  const labelEl = edit.querySelector("#editDateValue");
  if (labelEl) labelEl.textContent = formatMeetingDate(new Date(dateObj));
  // Also reflect to Add overlay Date chip immediately
  try {
    const root = document.getElementById("logMeetingOverlay") || document;
    const addOverlay = root.querySelector("#addMeetingOverlay");
    const addDateChip =
      addOverlay && addOverlay.querySelector("#meetingDateValue");
    if (addDateChip)
      addDateChip.textContent = labelEl
        ? labelEl.textContent
        : formatMeetingDate(new Date(dateObj));
  } catch {}
}

function editDTP_renderCalendar(edit) {
  const grid = edit.querySelector("#dtp-calendar");
  const title = edit.querySelector("#dtp-month-title");
  if (!grid || !title) return;

  // Determine current view from dataset or selected date
  let vy = parseInt(grid.dataset.year || "", 10);
  let vm = parseInt(grid.dataset.month || "", 10);
  const selected = editDTP_getSelectedDate(edit);
  let view =
    isNaN(vy) || isNaN(vm)
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(vy, vm, 1);

  grid.dataset.year = String(view.getFullYear());
  grid.dataset.month = String(view.getMonth());

  title.textContent = view.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const days = monthMatrix(view.getFullYear(), view.getMonth());
  grid.innerHTML = "";
  days.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "dtp-day" +
      (d.getMonth() !== view.getMonth() ? "inactive" : "") +
      (sameDay(d, selected) ? "selected" : "");
    btn.textContent = String(d.getDate());
    btn.setAttribute("aria-label", d.toDateString());
    btn.addEventListener("click", () => {
      editDTP_setSelectedDate(edit, d);
      // Keep view month synced with selected
      grid.dataset.year = String(d.getFullYear());
      grid.dataset.month = String(d.getMonth());
      editDTP_renderCalendar(edit);
      // Auto-save on date pick
      try {
        const root = document.getElementById("logMeetingOverlay") || document;
        scheduleAutoSave(root);
      } catch {}
    });
    grid.appendChild(btn);
  });

  const prev = edit.querySelector("#dtp-prev-month");
  const next = edit.querySelector("#dtp-next-month");
  if (prev && !prev.dataset.wired) {
    prev.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m - 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      editDTP_renderCalendar(edit);
    });
    prev.dataset.wired = "1";
  }
  if (next && !next.dataset.wired) {
    next.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m + 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      editDTP_renderCalendar(edit);
    });
    next.dataset.wired = "1";
  }
}

function ensureEditDatePicker(edit) {
  // Initialize selected label if missing
  editDTP_setSelectedDate(edit, editDTP_getSelectedDate(edit));
  editDTP_renderCalendar(edit);
}

// Helpers to keep time wheel active row vertically centered with the highlight
function wheel_getRowH(container) {
  const it =
    container &&
    container.querySelector &&
    container.querySelector(".dtp-wheel-item");
  return (it && it.clientHeight) || 36;
}
function wheel_getSpacer(container) {
  try {
    const rowH = wheel_getRowH(container);
    const viewH = container.clientHeight || 180;
    return Math.max(0, Math.round((viewH - rowH) / 2));
  } catch {
    return 72;
  }
}
function wheel_ensureSnap(container) {
  if (!container) return;
  const sp = wheel_getSpacer(container);
  container.style.paddingTop = sp + "px";
  container.style.paddingBottom = sp + "px";
  container.style.scrollSnapType = "y mandatory";
  Array.from(container.querySelectorAll(".dtp-wheel-item")).forEach((el) => {
    el.style.scrollSnapAlign = "center";
    // Stronger snapping to reduce jitter
    el.style.scrollSnapStop = "always";
  });
}

function editDTP_renderTimeWheels(edit, target /* 'start' | 'end' */) {
  const hidden = edit.querySelector(
    target === "start" ? "#editStart" : "#editEnd"
  );
  const labelEl = edit.querySelector(
    target === "start" ? "#editStartValue" : "#editEndValue"
  );
  const idSuffix = target === "start" ? "start" : "end";
  const elHour = edit.querySelector(`#dtp-wheel-hour-${idSuffix}`);
  const elMinute = edit.querySelector(`#dtp-wheel-minute-${idSuffix}`);
  const elAmPm = edit.querySelector(`#dtp-wheel-ampm-${idSuffix}`);
  if (!elHour || !elMinute || !elAmPm) return;

  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (hidden && hidden.value) {
    const [hh, mm] = hidden.value.split(":").map((n) => parseInt(n || "0", 10));
    if (!Number.isNaN(hh)) hours = hh;
    if (!Number.isNaN(mm)) minutes = mm;
  }
  minutes = Math.round(minutes / 5) * 5;
  if (minutes >= 60) minutes = 0;

  const hours12 = ((hours + 11) % 12) + 1;
  const ampm = hours >= 12 ? "PM" : "AM";

  const makeItems = (container, arr, current) => {
    container.innerHTML = "";
    arr.forEach((v) => {
      const div = document.createElement("div");
      div.className =
        "dtp-wheel-item" +
        (String(v.value) === String(current) ? " active" : "");
      div.textContent = v.label;
      div.dataset.value = String(v.value);
      container.appendChild(div);
    });
  };

  const hoursArr = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }));
  const minsArr = Array.from({ length: 12 }, (_, i) => {
    const v = (i * 5) % 60;
    return { value: v, label: pad2(v) };
  });
  const apArr = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  makeItems(elHour, hoursArr, hours12);
  makeItems(elMinute, minsArr, minutes);
  makeItems(elAmPm, apArr, ampm);

  // After items are created, enforce snap/spacer so the active row can center
  wheel_ensureSnap(elHour);
  wheel_ensureSnap(elMinute);
  wheel_ensureSnap(elAmPm);

  // Centering helpers
  const indexFromScrollTop = (container) => {
    const sp = wheel_getSpacer(container);
    const st = container.scrollTop || 0;
    const rowH = wheel_getRowH(container);
    return Math.round((st - sp) / rowH);
  };
  const centerActiveFor = (container, behavior = "auto") => {
    const active = container.querySelector(".dtp-wheel-item.active");
    if (!active) return;
    const items = Array.from(container.querySelectorAll(".dtp-wheel-item"));
    const idx = Math.max(0, items.indexOf(active));
    const sp = wheel_getSpacer(container);
    const rowH = wheel_getRowH(container);
    const top = sp + idx * rowH;
    container.scrollTo({ top, behavior });
  };
  const updateActiveFromScroll = (container) => {
    const items = container.querySelectorAll(".dtp-wheel-item");
    if (!items.length) return;
    const idx = Math.min(
      Math.max(0, indexFromScrollTop(container)),
      items.length - 1
    );
    items.forEach((el, i) => el.classList.toggle("active", i === idx));
  };
  const onScrollSync = (container, onIdle) => {
    let idleT = null;
    container.addEventListener(
      "scroll",
      () => {
        updateActiveFromScroll(container);
        if (idleT) clearTimeout(idleT);
        // Debounce commit to when momentum stops; no programmatic centering to avoid tug-of-war
        idleT = setTimeout(() => {
          if (typeof onIdle === "function") onIdle();
        }, 140);
      },
      { passive: true }
    );
  };

  // Initial center to current selections
  centerActiveFor(elHour, "auto");
  centerActiveFor(elMinute, "auto");
  centerActiveFor(elAmPm, "auto");
  // Ensure active state matches center on init
  updateActiveFromScroll(elHour);
  updateActiveFromScroll(elMinute);
  updateActiveFromScroll(elAmPm);

  // When wheels scroll, update active row live; when idle, compute and sync values
  const onIdleSync = () => computeAndSet();
  onScrollSync(elHour, onIdleSync);
  onScrollSync(elMinute, onIdleSync);
  onScrollSync(elAmPm, onIdleSync);

  const setActive = (container, value) => {
    container.querySelectorAll(".dtp-wheel-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.value === String(value));
    });
  };

  const computeAndSet = () => {
    const h12 = parseInt(
      elHour.querySelector(".dtp-wheel-item.active")?.dataset.value ||
        String(hours12),
      10
    );
    const m = parseInt(
      elMinute.querySelector(".dtp-wheel-item.active")?.dataset.value ||
        String(minutes),
      10
    );
    const mer =
      elAmPm.querySelector(".dtp-wheel-item.active")?.dataset.value || ampm;
    let h24 = h12 % 12;
    if (mer === "PM") h24 += 12;
    const hhmm = `${pad2(h24)}:${pad2(m)}`;
    if (hidden) hidden.value = hhmm;
    if (labelEl) {
      const d = new Date();
      d.setHours(h24, m, 0, 0);
      labelEl.textContent = formatMeetingTime(d);
    }

    // Keep start/end consistent: ensure end >= start, and if start changes with empty end, set end = start + 30m
    const parseHHmmToMinutes = (s) => {
      if (!s) return null;
      const [H, M] = s.split(":").map((n) => parseInt(n || "0", 10));
      if (Number.isNaN(H) || Number.isNaN(M)) return null;
      return H * 60 + M;
    };
    const minutesToHHmm = (mins) => {
      const mod = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
      const H = Math.floor(mod / 60);
      const M = mod % 60;
      return `${pad2(H)}:${pad2(M)}`;
    };

    if (target === "start") {
      const endHidden = edit.querySelector("#editEnd");
      const endLabel = edit.querySelector("#editEndValue");
      if (endHidden) {
        const sMin = parseHHmmToMinutes(hhmm);
        const eMin = parseHHmmToMinutes(endHidden.value);
        if (endHidden.value === "" || eMin === null) {
          const next = minutesToHHmm((sMin || 0) + 30);
          endHidden.value = next;
          if (endLabel) {
            const d2 = new Date();
            const [eh, em] = next.split(":").map((n) => parseInt(n || "0", 10));
            d2.setHours(eh, em, 0, 0);
            endLabel.textContent = formatMeetingTime(d2);
          }
        } else if ((eMin || 0) < (sMin || 0)) {
          const next = minutesToHHmm((sMin || 0) + 30);
          endHidden.value = next;
          if (endLabel) {
            const d2 = new Date();
            const [eh, em] = next.split(":").map((n) => parseInt(n || "0", 10));
            d2.setHours(eh, em, 0, 0);
            endLabel.textContent = formatMeetingTime(d2);
          }
        }
      }
    } else if (target === "end") {
      const startHidden = edit.querySelector("#editStart");
      if (startHidden && startHidden.value) {
        const sMin = parseHHmmToMinutes(startHidden.value) || 0;
        const eMin = parseHHmmToMinutes(hhmm) || 0;
        if (eMin < sMin) {
          // Snap end to start if user picked an earlier time
          if (hidden) hidden.value = startHidden.value;
          if (labelEl) {
            const d2 = new Date();
            const [sh, sm] = startHidden.value
              .split(":")
              .map((n) => parseInt(n || "0", 10));
            d2.setHours(sh, sm, 0, 0);
            labelEl.textContent = formatMeetingTime(d2);
          }
        }
      }
    }
    // Update Add overlay Time chip with current start/end
    try {
      const root = document.getElementById("logMeetingOverlay") || document;
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const timeChip =
        addOverlay && addOverlay.querySelector("#meetingTimeValue");
      const s = edit.querySelector("#editStart")?.value || "";
      const e = edit.querySelector("#editEnd")?.value || "";
      if (timeChip) timeChip.textContent = formatTimeRangeLabel(s, e);
    } catch {}
    // Trigger auto-save after wheels settle
    try {
      const root = document.getElementById("logMeetingOverlay") || document;
      scheduleAutoSave(root);
    } catch {}
  };

  const onClick = (e, kind) => {
    const item = e.target.closest && e.target.closest(".dtp-wheel-item");
    if (!item) return;
    setActive(kind, item.dataset.value);
    // Center the newly selected item immediately
    centerActiveFor(kind, "auto");
    computeAndSet();
  };
  // Avoid stacking multiple listeners across re-renders
  if (!elHour.dataset.wired) {
    elHour.addEventListener("click", (e) => onClick(e, elHour));
    elHour.dataset.wired = "1";
  }
  if (!elMinute.dataset.wired) {
    elMinute.addEventListener("click", (e) => onClick(e, elMinute));
    elMinute.dataset.wired = "1";
  }
  if (!elAmPm.dataset.wired) {
    elAmPm.addEventListener("click", (e) => onClick(e, elAmPm));
    elAmPm.dataset.wired = "1";
  }

  // Initial label reflect
  computeAndSet();
}

// ===== Meta overlay Due Date Picker (calendar, same as meeting date) =====
function metaDTP_getSelectedDate(meta) {
  try {
    const iso = meta.querySelector("#metaDue")?.value || "";
    return parseISOToDate(iso) || new Date();
  } catch {
    return new Date();
  }
}
function metaDTP_setSelectedDate(meta, dateObj) {
  const iso = localISODate(dateObj);
  const hidden = meta.querySelector("#metaDue");
  if (hidden) hidden.value = iso;
  const labelEl = meta.querySelector("#metaDueValue");
  if (labelEl) labelEl.textContent = formatMeetingDate(new Date(dateObj));
}
// Ensure meta due date picker is initialized (selected date + calendar)
function ensureMetaDueDatePicker(meta) {
  try {
    metaDTP_setSelectedDate(meta, metaDTP_getSelectedDate(meta));
    metaDTP_renderCalendar(meta);
  } catch (e) {
    console.warn("[LogMeeting] ensureMetaDueDatePicker failed", e);
  }
}
function metaDTP_renderCalendar(meta) {
  const grid = meta.querySelector("#meta-dtp-calendar");
  const title = meta.querySelector("#meta-dtp-month-title");
  if (!grid || !title) return;

  let vy = parseInt(grid.dataset.year || "", 10);
  let vm = parseInt(grid.dataset.month || "", 10);
  const sel = metaDTP_getSelectedDate(meta);
  let view =
    isNaN(vy) || isNaN(vm)
      ? new Date(sel.getFullYear(), sel.getMonth(), 1)
      : new Date(vy, vm, 1);

  grid.dataset.year = String(view.getFullYear());
  grid.dataset.month = String(view.getMonth());

  title.textContent = view.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const days = monthMatrix(view.getFullYear(), view.getMonth());
  grid.innerHTML = "";
  days.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "dtp-day" +
      (d.getMonth() !== view.getMonth() ? "inactive" : "") +
      (sameDay(d, sel) ? "selected" : "");
    btn.textContent = String(d.getDate());
    btn.setAttribute("aria-label", d.toDateString());
    btn.addEventListener("click", () => {
      metaDTP_setSelectedDate(meta, d);
      grid.dataset.year = String(d.getFullYear());
      grid.dataset.month = String(d.getMonth());
      metaDTP_renderCalendar(meta);
      // Reflect due date immediately to Add overlay and auto-save
      try {
        const root = document.getElementById("logMeetingOverlay") || document;
        const addOverlay = root.querySelector("#addMeetingOverlay");
        if (addOverlay) {
          const dueLabel = formatMeetingDate(new Date(d));
          const chipVal = addOverlay.querySelector(
            '.meta-chip[data-meta="due"] .chip-value'
          );
          if (chipVal) {
            chipVal.textContent = dueLabel || "Due";
            chipVal.classList.toggle("placeholder", !dueLabel);
          }
          const fCard = addOverlay.querySelector("#followUpCard");
          const addBtn = addOverlay.querySelector("#addFollowUpBtn");
          setHidden(fCard, false);
          setHidden(addBtn, true);
          toggleAddButtonsByList(addOverlay);
        }
        scheduleAutoSave(root);
      } catch {}
    });
    grid.appendChild(btn);
  });

  const prev = meta.querySelector("#meta-dtp-prev-month");
  const next = meta.querySelector("#meta-dtp-next-month");
  if (prev && !prev.dataset.wired) {
    prev.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m - 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      metaDTP_renderCalendar(meta);
    });
    prev.dataset.wired = "1";
  }
  if (next && !next.dataset.wired) {
    next.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m + 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      metaDTP_renderCalendar(meta);
    });
    next.dataset.wired = "1";
  }
}

function saveQuickAddMeeting(root) {
  const qa = root.querySelector("#quickAddOverlay");
  if (!qa) return;
  const title =
    qa.querySelector("#qaTitle")?.value?.trim() || "Untitled Meeting";
  const typeLabel =
    qa.querySelector("#qaTypeValue")?.textContent?.trim() || "Virtual";
  const dateISO = qa.querySelector("#qaDate")?.value || "";
  const startHHmm = qa.querySelector("#qaStart")?.value || "";
  const endHHmm = qa.querySelector("#qaEnd")?.value || "";
  const dateLabel = dateISO
    ? (() => {
        const d = parseISOToDate(dateISO);
        return d ? formatMeetingDate(d) : "";
      })()
    : formatMeetingDate(new Date());
  const durationLabel = computeDurationLabel(startHHmm, endHHmm);
  const recent = root.querySelector(".meeting-logs.recent-meetings");
  let cardEl = null;
  if (recent) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = meetingCardHTML({
      title,
      typeLabel,
      dateLabel,
      durationLabel: durationLabel || "—",
      pinned: false,
    });
    cardEl = wrapper.firstElementChild;
    ensureCardId(cardEl);
    cardEl.dataset.title = title;
    cardEl.dataset.type = typeLabel;
    cardEl.dataset.date = dateLabel;
    if (startHHmm) cardEl.dataset.start = startHHmm;
    if (endHHmm) cardEl.dataset.end = endHHmm;
    if (durationLabel) cardEl.dataset.duration = durationLabel;
    recent.prepend(cardEl);

    const obj = {
      id: ensureCardId(cardEl),
      title,
      type: typeLabel,
      date: dateLabel,
      start: startHHmm || "",
      end: endHHmm || "",
      duration: durationLabel || "",
      pinned: false,
    };
    upsertMeetingObj(obj);
  }

  // Close Quick Add and open full Add overlay prefilled for the new card
  qa.classList.remove("visible");
  qa.classList.add("hidden");
  if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();

  if (cardEl) {
    openAddOverlayPrefilledFromCard(root, cardEl);
  }

  applyMeetingsSearchFilter(root);
  const sortSel = root.querySelector("#recentSort");
  if (sortSel) sortRecentList(root, sortSel.value || "newest");
}

function openQuickAddOverlay(root) {
  const qa = root.querySelector("#quickAddOverlay");
  if (!qa) return;
  if (qa.querySelector("#qaTitle")) qa.querySelector("#qaTitle").value = "";
  const typeVal = qa.querySelector("#qaTypeValue");
  if (typeVal) typeVal.textContent = "Virtual";
  // Defaults: start today, end unset
  qaDate_setSelectedDate(qa, new Date());
  qaDate_renderCalendar(qa);
  // Default start: rounded now; end: +30m
  const now = new Date();
  const startHHmm = toHHmmRounded(now, 5);
  const [sh, sm] = startHHmm.split(":").map((n) => parseInt(n || "0", 10));
  const endDate = new Date(now);
  endDate.setHours(sh, sm + 30, 0, 0);
  const endHHmm = `${String(endDate.getHours()).padStart(2, "0")}:${String(
    endDate.getMinutes()
  ).padStart(2, "0")}`;
  const setTime = (selHidden, selLabel, hhmm) => {
    const hid = qa.querySelector(selHidden);
    const lab = qa.querySelector(selLabel);
    if (hid) hid.value = hhmm;
    if (lab) {
      const d = new Date();
      const [h, m] = hhmm.split(":").map((n) => parseInt(n || "0", 10));
      d.setHours(h, m, 0, 0);
      lab.textContent = formatMeetingTime(d);
    }
  };
  setTime("#qaStart", "#qaStartValue", startHHmm);
  setTime("#qaEnd", "#qaEndValue", endHHmm);
  qa.classList.add("visible");
  qa.classList.remove("hidden");
  if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
}

// ===== Quick Add inline Date Picker (calendar, same as edit overlay) =====
function qaDTP_getSelectedDate(qa, which /* 'start' | 'end' */) {
  try {
    const iso =
      qa.querySelector(which === "start" ? "#qaStartDate" : "#qaEndDate")
        ?.value || "";
    return parseISOToDate(iso) || new Date();
  } catch {
    return new Date();
  }
}
function qaDTP_setSelectedDate(qa, which, dateObj) {
  const iso = localISODate(dateObj);
  const hidden = qa.querySelector(
    which === "start" ? "#qaStartDate" : "#qaEndDate"
  );
  if (hidden) hidden.value = iso;
  const labelEl = qa.querySelector(
    which === "start" ? "#qaStartDateValue" : "#qaEndDateValue"
  );
  if (labelEl) labelEl.textContent = formatMeetingDate(new Date(dateObj));
}
function qaDTP_renderCalendar(qa, which /* 'start' | 'end' */) {
  const grid = qa.querySelector(
    which === "start" ? "#qa-dtp-calendar-start" : "#qa-dtp-calendar-end"
  );
  const title = qa.querySelector(
    which === "start" ? "#qa-dtp-month-title-start" : "#qa-dtp-month-title-end"
  );
  if (!grid || !title) return;

  // Determine current view from dataset or selected date
  let vy = parseInt(grid.dataset.year || "", 10);
  let vm = parseInt(grid.dataset.month || "", 10);
  const selected = qaDTP_getSelectedDate(qa, which);
  let view =
    isNaN(vy) || isNaN(vm)
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(vy, vm, 1);

  grid.dataset.year = String(view.getFullYear());
  grid.dataset.month = String(view.getMonth());

  title.textContent = view.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const days = monthMatrix(view.getFullYear(), view.getMonth());
  grid.innerHTML = "";
  days.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "dtp-day" +
      (d.getMonth() !== view.getMonth() ? "inactive" : "") +
      (sameDay(d, selected) ? "selected" : "");
    btn.textContent = String(d.getDate());
    btn.setAttribute("aria-label", d.toDateString());
    btn.addEventListener("click", () => {
      qaDTP_setSelectedDate(qa, which, d);
      // Keep view month synced with selected
      grid.dataset.year = String(d.getFullYear());
      grid.dataset.month = String(d.getMonth());
      qaDTP_renderCalendar(qa, which);
    });
    grid.appendChild(btn);
  });

  const prev = qa.querySelector(
    which === "start" ? "#qa-dtp-prev-month-start" : "#qa-dtp-prev-month-end"
  );
  const next = qa.querySelector(
    which === "start" ? "#qa-dtp-next-month-start" : "#qa-dtp-next-month-end"
  );
  if (prev && !prev.dataset.wired) {
    prev.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m - 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      qaDTP_renderCalendar(qa, which);
    });
    prev.dataset.wired = "1";
  }
  if (next && !next.dataset.wired) {
    next.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m + 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      qaDTP_renderCalendar(qa, which);
    });
    next.dataset.wired = "1";
  }
}

// ===== Quick Add (bottom sheet) helpers aligned with edit-overlay =====
function qaDate_getSelectedDate(qa) {
  const iso = qa.querySelector("#qaDate")?.value || "";
  return parseISOToDate(iso) || new Date();
}
function qaDate_setSelectedDate(qa, dateObj) {
  const iso = localISODate(dateObj);
  const hidden = qa.querySelector("#qaDate");
  if (hidden) hidden.value = iso;
  const labelEl = qa.querySelector("#qaDateValue");
  if (labelEl) labelEl.textContent = formatMeetingDate(new Date(dateObj));
}
function qaDate_renderCalendar(qa) {
  const grid = qa.querySelector("#qa-dtp-calendar");
  const title = qa.querySelector("#qa-dtp-month-title");
  if (!grid || !title) return;
  let vy = parseInt(grid.dataset.year || "", 10);
  let vm = parseInt(grid.dataset.month || "", 10);
  const selected = qaDate_getSelectedDate(qa);
  let view =
    isNaN(vy) || isNaN(vm)
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(vy, vm, 1);
  grid.dataset.year = String(view.getFullYear());
  grid.dataset.month = String(view.getMonth());
  title.textContent = view.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const days = monthMatrix(view.getFullYear(), view.getMonth());
  grid.innerHTML = "";
  days.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "dtp-day" +
      (d.getMonth() !== view.getMonth() ? " inactive" : "") +
      (sameDay(d, selected) ? " selected" : "");
    btn.textContent = String(d.getDate());
    btn.setAttribute("aria-label", d.toDateString());
    btn.addEventListener("click", () => {
      qaDate_setSelectedDate(qa, d);
      grid.dataset.year = String(d.getFullYear());
      grid.dataset.month = String(d.getMonth());
      qaDate_renderCalendar(qa);
    });
    grid.appendChild(btn);
  });
  const prev = qa.querySelector("#qa-dtp-prev-month");
  const next = qa.querySelector("#qa-dtp-next-month");
  if (prev && !prev.dataset.wired) {
    prev.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m - 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      qaDate_renderCalendar(qa);
    });
    prev.dataset.wired = "1";
  }
  if (next && !next.dataset.wired) {
    next.addEventListener("click", () => {
      const y = parseInt(grid.dataset.year || "", 10) || view.getFullYear();
      const m = parseInt(grid.dataset.month || "", 10) || view.getMonth();
      const nv = new Date(y, m + 1, 1);
      grid.dataset.year = String(nv.getFullYear());
      grid.dataset.month = String(nv.getMonth());
      qaDate_renderCalendar(qa);
    });
    next.dataset.wired = "1";
  }
}
function qaTime_renderWheels(qa, target /* 'start' | 'end' */) {
  const hidden = qa.querySelector(target === "start" ? "#qaStart" : "#qaEnd");
  const labelEl = qa.querySelector(
    target === "start" ? "#qaStartValue" : "#qaEndValue"
  );
  const idSuffix = target === "start" ? "start" : "end";
  const elHour = qa.querySelector(`#qa-dtp-wheel-hour-${idSuffix}`);
  const elMinute = qa.querySelector(`#qa-dtp-wheel-minute-${idSuffix}`);
  const elAmPm = qa.querySelector(`#qa-dtp-wheel-ampm-${idSuffix}`);
  if (!elHour || !elMinute || !elAmPm) return;
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (hidden && hidden.value) {
    const [hh, mm] = hidden.value.split(":").map((n) => parseInt(n || "0", 10));
    if (!Number.isNaN(hh)) hours = hh;
    if (!Number.isNaN(mm)) minutes = mm;
  }
  minutes = Math.round(minutes / 5) * 5;
  if (minutes >= 60) minutes = 0;
  const hours12 = ((hours + 11) % 12) + 1;
  const ampm = hours >= 12 ? "PM" : "AM";
  const makeItems = (container, arr, current) => {
    container.innerHTML = "";
    arr.forEach((v) => {
      const div = document.createElement("div");
      div.className =
        "dtp-wheel-item" +
        (String(v.value) === String(current) ? " active" : "");
      div.textContent = v.label;
      div.dataset.value = String(v.value);
      container.appendChild(div);
    });
  };
  const hoursArr = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }));
  const minsArr = Array.from({ length: 12 }, (_, i) => {
    const v = (i * 5) % 60;
    return { value: v, label: String(v).padStart(2, "0") };
  });
  const apArr = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];
  makeItems(elHour, hoursArr, hours12);
  makeItems(elMinute, minsArr, minutes);
  makeItems(elAmPm, apArr, ampm);
  // After items are created, enforce snap/spacer so the active row can center
  wheel_ensureSnap(elHour);
  wheel_ensureSnap(elMinute);
  wheel_ensureSnap(elAmPm);
  const ROW_H = 36;
  const VIEW_H = 180;
  const SPACER = (VIEW_H - ROW_H) / 2;
  const indexFromScrollTop = (container) => {
    const sp = wheel_getSpacer(container);
    const st = container.scrollTop || 0;
    const rowH = wheel_getRowH(container);
    return Math.round((st - sp) / rowH);
  };
  const centerActiveFor = (container, behavior = "auto") => {
    const active = container.querySelector(".dtp-wheel-item.active");
    if (!active) return;
    const items = Array.from(container.querySelectorAll(".dtp-wheel-item"));
    const idx = Math.max(0, items.indexOf(active));
    const sp = wheel_getSpacer(container);
    const rowH = wheel_getRowH(container);
    const top = sp + idx * rowH;
    container.scrollTo({ top, behavior });
  };
  const updateActiveFromScroll = (container) => {
    const items = container.querySelectorAll(".dtp-wheel-item");
    if (!items.length) return;
    const idx = Math.min(
      Math.max(0, indexFromScrollTop(container)),
      items.length - 1
    );
    items.forEach((el, i) => el.classList.toggle("active", i === idx));
  };
  const onScrollSync = (container, onIdle) => {
    let idleT = null;
    container.addEventListener(
      "scroll",
      () => {
        updateActiveFromScroll(container);
        if (idleT) clearTimeout(idleT);
        idleT = setTimeout(() => {
          if (typeof onIdle === "function") onIdle();
        }, 140);
      },
      { passive: true }
    );
  };
  centerActiveFor(elAmPm, "auto");
  updateActiveFromScroll(elHour);
  updateActiveFromScroll(elMinute);
  updateActiveFromScroll(elAmPm);
  const computeAndSet = () => {
    const h12 = parseInt(
      elHour.querySelector(".dtp-wheel-item.active")?.dataset.value ||
        String(hours12),
      10
    );
    const m = parseInt(
      elMinute.querySelector(".dtp-wheel-item.active")?.dataset.value ||
        String(minutes),
      10
    );
    const mer =
      elAmPm.querySelector(".dtp-wheel-item.active")?.dataset.value || ampm;
    let h24 = h12 % 12;
    if (mer === "PM") h24 += 12;
    const hhmm = `${String(h24).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}`;
    if (hidden) hidden.value = hhmm;
    if (labelEl) {
      const d = new Date();
      d.setHours(h24, m, 0, 0);
      labelEl.textContent = formatMeetingTime(d);
    }
    const parseHHmmToMinutes = (s) => {
      if (!s) return null;
      const [H, M] = s.split(":").map((n) => parseInt(n || "0", 10));
      if (Number.isNaN(H) || Number.isNaN(M)) return null;
      return H * 60 + M;
    };
    const minutesToHHmm = (mins) => {
      const mod = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
      const H = Math.floor(mod / 60);
      const M = mod % 60;
      return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
    };
    if (target === "start") {
      const endHidden = qa.querySelector("#qaEnd");
      const endLabel = qa.querySelector("#qaEndValue");
      if (endHidden) {
        const sMin = parseHHmmToMinutes(hhmm);
        const eMin = parseHHmmToMinutes(endHidden.value);
        if (
          endHidden.value === "" ||
          eMin === null ||
          (eMin || 0) < (sMin || 0)
        ) {
          const next = minutesToHHmm((sMin || 0) + 30);
          endHidden.value = next;
          if (endLabel) {
            const d2 = new Date();
            const [eh, em] = next.split(":").map((n) => parseInt(n || "0", 10));
            d2.setHours(eh, em, 0, 0);
            endLabel.textContent = formatMeetingTime(d2);
          }
        }
      }
    } else if (target === "end") {
      const startHidden = qa.querySelector("#qaStart");
      if (startHidden && startHidden.value) {
        const sMin = parseHHmmToMinutes(startHidden.value) || 0;
        const eMin = parseHHmmToMinutes(hhmm) || 0;
        if (eMin < sMin) {
          if (hidden) hidden.value = startHidden.value;
          if (labelEl) {
            const d2 = new Date();
            const [sh, sm] = startHidden.value
              .split(":")
              .map((n) => parseInt(n || "0", 10));
            d2.setHours(sh, sm, 0, 0);
            labelEl.textContent = formatMeetingTime(d2);
          }
        }
      }
    }
  };
  const onClick = (e, kind) => {
    const item = e.target.closest && e.target.closest(".dtp-wheel-item");
    if (!item) return;
    kind
      .querySelectorAll(".dtp-wheel-item")
      .forEach((el) => el.classList.toggle("active", el === item));
    centerActiveFor(kind, "auto");
    computeAndSet();
  };
  if (!elHour.dataset.wired) {
    elHour.addEventListener("click", (e) => onClick(e, elHour));
    elHour.dataset.wired = "1";
  }
  if (!elMinute.dataset.wired) {
    elMinute.addEventListener("click", (e) => onClick(e, elMinute));
    elMinute.dataset.wired = "1";
  }
  if (!elAmPm.dataset.wired) {
    elAmPm.addEventListener("click", (e) => onClick(e, elAmPm));
    elAmPm.dataset.wired = "1";
  }
  onScrollSync(elHour, computeAndSet);
  onScrollSync(elMinute, computeAndSet);
  onScrollSync(elAmPm, computeAndSet);
  computeAndSet();
}

function wireOverlayEventDelegation(root) {
  if (!root || root.dataset.delegateWired) return;

  root.addEventListener("click", (e) => {
    const t = e.target;

    // Quick Add: close via header back
    if (t.closest && t.closest("#quickAddOverlay .close-btn")) {
      const qa = root.querySelector("#quickAddOverlay");
      if (qa) {
        qa.classList.remove("visible");
        qa.classList.add("hidden");
        if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
      }
      return;
    }

    // Add/Edit Tags buttons -> open Tags overlay
    if (t.closest && (t.closest("#addTagsBtn") || t.closest("#editTagsBtn"))) {
      openTagsOverlay(root);
      return;
    }

    // Add/Edit Attachments buttons -> open Attachments overlay
    if (
      t.closest &&
      (t.closest("#addAttachmentsBtn") || t.closest("#editAttachmentsBtn"))
    ) {
      openAttachmentsOverlay(root);
      return;
    }

    // Inline remove tag in Add overlay
    if (t.closest && t.closest("#tagsList .tag-chip .remove")) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const hidden = addOverlay && addOverlay.querySelector("#editTags");
      const current = parseCSVList(hidden ? hidden.value : "");
      const chip = t.closest(".tag-chip");
      const label = chip && chip.querySelector(".label"); // may be null
      const val = (label && (label.textContent || "").trim()) || "";
      const next = current.filter((x) => x !== val);
      renderTagsList(addOverlay, next);
      toggleAddButtonsByList(addOverlay);
      scheduleAutoSave(root);
      return;
    }

    // Inline remove attachment in Add overlay
    if (t.closest && t.closest("#attachmentsList .attachment-item .remove")) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const hidden = addOverlay && addOverlay.querySelector("#editAttachments");
      const current = parseCSVList(hidden ? hidden.value : "");
      const li = t.closest(".attachment-item");
      const nameEl = li && li.querySelector(".name");
      const val = (nameEl && (nameEl.textContent || "").trim()) || "";
      const next = current.filter((x) => x !== val);
      renderAttachmentsList(addOverlay, next);
      toggleAddButtonsByList(addOverlay);
      scheduleAutoSave(root);
      return;
    }

    // Close/cancel Tags overlay -> keep current selections (already synced on toggle), just close
    if (
      t.closest &&
      (t.closest(".tags-overlay .close-btn") || t.closest("#cancel-tags"))
    ) {
      const sheet = root.querySelector(".tags-overlay");
      if (sheet) {
        sheet.classList.remove("visible");
        sheet.classList.add("hidden");
      }
      return;
    }

    // Close/cancel Attachments overlay
    if (
      t.closest &&
      (t.closest(".attachments-overlay .close-btn") ||
        t.closest("#cancel-attachments"))
    ) {
      const sheet = root.querySelector(".attachments-overlay");
      if (sheet) {
        sheet.classList.remove("visible");
        sheet.classList.add("hidden");
      }
      return;
    }

    // Add file(s) from attachments overlay
    if (t.closest && t.closest("#attAddFilesBtn")) {
      const sheet = root.querySelector(".attachments-overlay");
      const input = sheet && sheet.querySelector("#attFileInput");
      if (input && input.click) input.click();
      return;
    }

    // Remove a tag chip inside tags overlay
    if (t.closest && t.closest(".tags-overlay .tag-chip .remove")) {
      const chip = t.closest(".tag-chip");
      if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
      // Reflect to Add overlay immediately and auto-save
      const sheet = root.querySelector(".tags-overlay");
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const tags = Array.from(
        sheet.querySelectorAll("#taTagsChips .tag-chip .label")
      ).map((n) => (n.textContent || "").trim());
      if (addOverlay) {
        renderTagsList(addOverlay, tags);
        toggleAddButtonsByList(addOverlay);
      }
      scheduleAutoSave(root);
      return;
    }

    // Remove an attachment item inside attachments overlay
    if (
      t.closest &&
      t.closest(".attachments-overlay .attachment-item .remove")
    ) {
      const li = t.closest(".attachment-item");
      if (li && li.parentNode) li.parentNode.removeChild(li);
      // Reflect to Add overlay immediately and auto-save
      const sheet = root.querySelector(".attachments-overlay");
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const files = Array.from(
        sheet.querySelectorAll("#attFilesList .attachment-item .name")
      ).map((n) => (n.textContent || "").trim());
      if (addOverlay) {
        renderAttachmentsList(addOverlay, files);
        toggleAddButtonsByList(addOverlay);
      }
      scheduleAutoSave(root);
      return;
    }

    // Rating stars click -> set rating
    const starBtn = t.closest && t.closest(".rating-section .rating-star");
    if (starBtn) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const v = parseInt(starBtn.getAttribute("data-value") || "0", 10) || 0;
      setRatingUI(addOverlay, v);
      scheduleAutoSave(root);
      return;
    }

    // Open Add Meeting overlay from a card click (prefilled)
    const cardEl = t.closest && t.closest(".meeting-logs .meeting-card");
    if (
      cardEl &&
      !t.closest("button") &&
      !t.closest("a") &&
      !t.closest(".fab-button")
    ) {
      openAddOverlayPrefilledFromCard(root, cardEl);
      toggleAddButtonsByList(root.querySelector("#addMeetingOverlay"));
      return;
    }

    // Close Add Meeting overlay (header back or footer cancel)
    if (
      t.closest &&
      (t.closest("#addMeetingOverlay .side-overlay-header .close-btn") ||
        t.closest("#cancel-add-meeting"))
    ) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      if (addOverlay) {
        addOverlay.classList.remove("visible");
        addOverlay.classList.add("hidden");
        if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
        // Reset so a fresh meeting starts next time
        try {
          resetAddMeetingOverlay(addOverlay);
        } catch {}
      }
      return;
    }

    // Open Edit overlay from the entire inline-tools area (and test button)
    if (
      t.closest &&
      (t.closest("#add-meeting-form .inline-tools") ||
        t.closest("#random-close-button"))
    ) {
      if (t.closest && t.closest("#toolMeetingLocation")) {
        // Do not handle here; dedicated handler below will open Edit overlay and focus Location
      } else {
        const editOverlay = root.querySelector(".edit-overlay");
        if (editOverlay) {
          syncInlineToEdit(root);
          editOverlay.classList.add("visible");
          editOverlay.classList.remove("hidden");
        }
        return;
      }
    }

    // Close Edit overlay (X or Cancel) — scope to the closest overlay
    if (
      t.closest &&
      (t.closest(".edit-overlay .close-btn") ||
        t.closest(".edit-overlay #cancel-edit-meeting"))
    ) {
      const editOverlay = t.closest && t.closest(".edit-overlay");
      if (editOverlay) {
        try {
          saveEditToInline(root);
        } catch {}
        try {
          scheduleAutoSave(root);
        } catch {}
        editOverlay.classList.remove("visible");
        editOverlay.classList.add("hidden");
        // collapse any open inline pickers within that overlay
        editOverlay
          .querySelectorAll(".inline-picker-row:not([hidden])")
          .forEach((row) => (row.hidden = true));
        editOverlay
          .querySelectorAll(".ios-list-item[aria-controls]")
          .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
      }
      return;
    }

    // Edit overlay pickers (inline like iOS Calendar)
    const edit = t.closest && t.closest(".edit-overlay");
    if (edit) {
      const item = t.closest(".ios-list-item");
      if (item) {
        const action = item.getAttribute("data-action");

        // Shared inline row toggle helper for this overlay
        const toggleInlineRow = (rowId) => {
          const row = edit.querySelector(`#${rowId}`);
          if (!row) return;
          const open = !row.hidden;
          edit
            .querySelectorAll(".inline-picker-row")
            .forEach((r) => (r.hidden = true));
          edit
            .querySelectorAll(".ios-list-item[aria-controls]")
            .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
          row.hidden = open;
          const controlledBtn = edit.querySelector(
            `.ios-list-item[aria-controls="${rowId}"]`
          );
          if (controlledBtn)
            controlledBtn.setAttribute(
              "aria-expanded",
              row.hidden ? "false" : "true"
            );
        };

        // Quick Add overlay actions (qa-pick-*)
        const isQuickAdd = edit.id === "quickAddOverlay";
        if (isQuickAdd) {
          // Use shared toggleInlineRow
          if (action === "qa-pick-type") {
            const current =
              edit.querySelector("#qaTypeValue")?.textContent?.trim() ||
              "Virtual";
            openTypePicker(item, current, (val) => {
              const v = edit.querySelector("#qaTypeValue");
              if (v) v.textContent = val;
            });
            return;
          }
          if (action === "qa-pick-date") {
            toggleInlineRow("qaDateRow");
            qaDate_renderCalendar(edit);
            return;
          }
          if (action === "qa-pick-start") {
            toggleInlineRow("qaStartPickerRow");
            qaTime_renderWheels(edit, "start");
            return;
          }
          if (action === "qa-pick-end") {
            toggleInlineRow("qaEndPickerRow");
            qaTime_renderWheels(edit, "end");
            return;
          }
        }

        if (action === "pick-type") {
          const current =
            edit.querySelector("#editTypeValue")?.textContent?.trim() ||
            "Virtual";
          openTypePicker(item, current, (val) => {
            edit.querySelector("#editTypeValue").textContent = val;
            edit.querySelector("#editType").value = val;
            // Reflect to Add overlay chip and icon immediately
            try {
              const addOverlay = root.querySelector("#addMeetingOverlay");
              const chip =
                addOverlay && addOverlay.querySelector("#meetingTypeValue");
              if (chip) chip.textContent = val;
              updateTypeIconsUI(root, val);
            } catch {}
            scheduleAutoSave(root);
          });
          return;
        }

        if (action === "pick-date") {
          // Always show inline calendar
          toggleInlineRow("datePickerRow");
          ensureEditDatePicker(edit);
          return;
        }

        if (action === "pick-start") {
          // Always show inline time wheels
          toggleInlineRow("startPickerRow");
          editDTP_renderTimeWheels(edit, "start");
          return;
        }

        if (action === "pick-end") {
          // Always show inline time wheels
          toggleInlineRow("endPickerRow");
          editDTP_renderTimeWheels(edit, "end");
          return;
        }

        if (action === "pick-location") {
          // Show inline location input row instead of prompt
          toggleInlineRow("locationPickerRow");
          const input = edit.querySelector("#editLocationInput");
          const hidden = edit.querySelector("#editLocation");
          const placeholder = edit.querySelector("#editLocationPlaceholder");
          // Seed current value
          const current =
            (hidden && hidden.value) ||
            (placeholder && placeholder.textContent.trim()) ||
            "";
          if (input) {
            input.value =
              current && current.toLowerCase() !== "add" ? current : "";
            input.focus();
            input.select && input.select();
          }
          return;
        }

        if (action === "pick-attendees") {
          const current = edit.querySelector("#editAttendees")?.value || "";
          const val =
            window.prompt("Add attendees (comma separated)", current) || "";
          edit.querySelector("#editAttendees").value = val;
          const label = val
            ? val
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .join(", ")
            : "Add";
          edit.querySelector("#editAttendeesPlaceholder").textContent = label;
          // Reflect to Add overlay chip immediately
          try {
            const addOverlay = root.querySelector("#addMeetingOverlay");
            const chip =
              addOverlay && addOverlay.querySelector("#meetingAttendeesValue");
            if (chip) chip.textContent = label;
          } catch {}
          // collapse inline pickers when using prompts
          edit
            .querySelectorAll(".inline-picker-row")
            .forEach((r) => (r.hidden = true));
          edit
            .querySelectorAll(".ios-list-item[aria-controls]")
            .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
          scheduleAutoSave(root);
          return;
        }
      }
    }

    // Open Meta overlay from meta-chips edit button
    if (t.closest && t.closest(".meta-card .tool-btn.edit")) {
      const metaOverlay = root.querySelector(".meta-edit-overlay");
      if (metaOverlay) {
        // Prefill meta overlay from chips in Add overlay
        const addOverlay = root.querySelector("#addMeetingOverlay");
        const chipVal = (meta) => {
          const el = addOverlay?.querySelector(
            `.meta-chip[data-meta="${meta}"] .chip-value`
          );
          if (!el) return "";
          const isPlaceholder = el.classList.contains("placeholder");
          return isPlaceholder ? "" : (el.textContent || "").trim();
        };
        const pr = chipVal("priority") || "Medium";
        const st = chipVal("status") || "Open";
        const dueLabel = chipVal("due");
        const asg = chipVal("assigned");
        const dueISO = dueLabel ? toISODateFromLabel(dueLabel) : "";

        const setText = (sel, text) => {
          const el = metaOverlay.querySelector(sel);
          if (el) el.textContent = text;
        };
        const setVal = (sel, val) => {
          const el = metaOverlay.querySelector(sel);
          if (el) el.value = val;
        };

        setVal("#metaPriority", pr);
        setText("#metaPriorityValue", pr);
        setVal("#metaStatus", st);
        setText("#metaStatusValue", st);
        setVal("#metaDue", dueISO);
        setText("#metaDueValue", dueLabel || "Add");
        setVal("#metaAssigned", asg);
        setText("#metaAssignedValue", asg || "Add");

        metaOverlay.classList.add("visible");
        metaOverlay.classList.remove("hidden");
      }
      return;
    }

    // Close Meta overlay (X or Cancel)
    if (
      t.closest &&
      (t.closest(".meta-edit-overlay .close-btn") ||
        t.closest("#cancel-edit-meta"))
    ) {
      const metaOverlay = root.querySelector(".meta-edit-overlay");
      if (metaOverlay) {
        metaOverlay.classList.remove("visible");
        metaOverlay.classList.add("hidden");
        // collapse inline pickers inside meta overlay
        metaOverlay
          .querySelectorAll(".inline-picker-row:not([hidden])")
          .forEach((row) => (row.hidden = true));
        metaOverlay
          .querySelectorAll(".ios-list-item[aria-controls]")
          .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
      }
      return;
    }

    // Meta overlay pickers
    const meta = t.closest && t.closest(".meta-edit-overlay");
    if (meta) {
      const item = t.closest(".ios-list-item");
      if (item) {
        const action = item.getAttribute("data-action");
        const toggleInlineRow = (rowId) => {
          const row = meta.querySelector(`#${rowId}`);
          if (!row) return;
          const open = !row.hidden;
          meta
            .querySelectorAll(".inline-picker-row")
            .forEach((r) => (r.hidden = true));
          meta
            .querySelectorAll(".ios-list-item[aria-controls]")
            .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
          row.hidden = open;
          const controlledBtn = meta.querySelector(
            `.ios-list-item[aria-controls="${rowId}"]`
          );
          if (controlledBtn)
            controlledBtn.setAttribute(
              "aria-expanded",
              row.hidden ? "false" : "true"
            );
        };

        if (action === "pick-priority") {
          const current =
            meta.querySelector("#metaPriorityValue")?.textContent?.trim() ||
            "Medium";
          openPopupMenu(item, ["Low", "Medium", "High"], current, (val) => {
            meta.querySelector("#metaPriorityValue").textContent = val;
            meta.querySelector("#metaPriority").value = val;
            // Reflect immediately to Add overlay and auto-save
            try {
              const addOverlay = root.querySelector("#addMeetingOverlay");
              if (addOverlay) {
                const chipVal = addOverlay.querySelector(
                  '.meta-chip[data-meta="priority"] .chip-value'
                );
                if (chipVal) {
                  chipVal.textContent = val;
                  chipVal.classList.remove("placeholder");
                }
                setPriorityChipClassOnOverlay(addOverlay, val);
                const fCard = addOverlay.querySelector("#followUpCard");
                const addBtn = addOverlay.querySelector("#addFollowUpBtn");
                setHidden(fCard, false);
                setHidden(addBtn, true);
                toggleAddButtonsByList(addOverlay);
              }
              scheduleAutoSave(root);
            } catch {}
          });
          return;
        }
        if (action === "pick-status") {
          const current =
            meta.querySelector("#metaStatusValue")?.textContent?.trim() ||
            "Open";
          openPopupMenu(
            item,
            ["Open", "In Progress", "Closed"],
            current,
            (val) => {
              meta.querySelector("#metaStatusValue").textContent = val;
              meta.querySelector("#metaStatus").value = val;
              // Reflect immediately to Add overlay and auto-save
              try {
                const addOverlay = root.querySelector("#addMeetingOverlay");
                if (addOverlay) {
                  const chipVal = addOverlay.querySelector(
                    '.meta-chip[data-meta="status"] .chip-value'
                  );
                  if (chipVal) {
                    chipVal.textContent = val;
                    chipVal.classList.remove("placeholder");
                  }
                  const fCard = addOverlay.querySelector("#followUpCard");
                  const addBtn = addOverlay.querySelector("#addFollowUpBtn");
                  setHidden(fCard, false);
                  setHidden(addBtn, true);
                  toggleAddButtonsByList(addOverlay);
                }
                scheduleAutoSave(root);
              } catch {}
            }
          );
          return;
        }
        if (action === "pick-due") {
          // Always inline due date calendar
          toggleInlineRow("metaDuePickerRow");
          ensureMetaDueDatePicker(meta);
          return;
        }
        if (action === "pick-assigned") {
          const current = meta.querySelector("#metaAssigned")?.value || "";
          const val = window.prompt("Assign to", current) || "";
          meta.querySelector("#metaAssigned").value = val;
          meta.querySelector("#metaAssignedValue").textContent = val
            ? val
            : "Add";
          // Reflect immediately to Add overlay and auto-save
          try {
            const addOverlay = root.querySelector("#addMeetingOverlay");
            if (addOverlay) {
              const chipVal = addOverlay.querySelector(
                '.meta-chip[data-meta="assigned"] .chip-value'
              );
              if (chipVal) {
                chipVal.textContent = val || "Assigned";
                chipVal.classList.toggle("placeholder", !val);
              }
              const fCard = addOverlay.querySelector("#followUpCard");
              const addBtn = addOverlay.querySelector("#addFollowUpBtn");
              setHidden(fCard, false);
              setHidden(addBtn, true);
              toggleAddButtonsByList(addOverlay);
            }
            scheduleAutoSave(root);
          } catch {}
          return;
        }
      }
    }

    // Toggle pin on card pin button
    const pinBtn = t.closest && t.closest(".pin-btn");
    if (pinBtn) {
      const card = pinBtn.closest(".meeting-card");
      if (card) {
        const currentlyPinned = card.dataset.pinned === "true";
        const nextPinned = !currentlyPinned;
        setCardPinnedUI(card, nextPinned);
        const pinnedList = root.querySelector(".meeting-logs.pinned-meetings");
        const recent = root.querySelector(".meeting-logs.recent-meetings");
        if (nextPinned && pinnedList) pinnedList.prepend(card);
        if (!nextPinned && recent) recent.prepend(card);
        const id = ensureCardId(card);
        updateMeetingPinned(id, nextPinned);
        applyMeetingsSearchFilter(root);
        // Keep sorting applied on Recent after moves
        const sortSel = root.querySelector("#recentSort");
        if (sortSel) sortRecentList(root, sortSel.value || "newest");
      }
      return;
    }

    // Header Save icon -> now opens a popup with two options (previous save action removed)
    if (t.closest && t.closest("#addMeetingSaveBtn")) {
      const btn = t.closest("#addMeetingSaveBtn");
      openPopupMenu(btn, ["PDF", "DOCX"], "", (choice) => {
        console.log("Export chosen:", choice);
      });
      return;
    }

    // Header Delete icon -> delete meeting if editing, or just close
    if (t.closest && t.closest("#addMeetingDeleteBtn")) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const editingId = addOverlay ? addOverlay.dataset.editingCardId : "";
      if (editingId) {
        const titleInput = root.querySelector("#meetingTitle");
        const title = (titleInput && titleInput.value.trim()) || "this meeting";
        const ok = window.confirm(`Delete “${title}”? This cannot be undone.`);
        if (!ok) return;
        const card = root.querySelector(
          `.meeting-card[data-card-id="${editingId}"]`
        );
        if (card && card.parentNode) card.parentNode.removeChild(card);
        deleteMeetingById(editingId);
      }
      if (addOverlay) {
        addOverlay.classList.remove("visible");
        addOverlay.classList.add("hidden");
        delete addOverlay.dataset.editingCardId;
        if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
        try {
          resetAddMeetingOverlay(addOverlay);
        } catch {}
      }
      applyMeetingsSearchFilter(root);
      // Re-sort recent after deletion
      const sortSel = root.querySelector("#recentSort");
      if (sortSel) sortRecentList(root, sortSel.value || "newest");
      return;
    }

    // Add Follow Up button -> open Meta overlay
    if (t.closest && t.closest("#addFollowUpBtn")) {
      const metaOverlay = root.querySelector(".meta-edit-overlay");
      if (metaOverlay) {
        // Prefill defaults
        const setText = (sel, txt) => {
          const el = metaOverlay.querySelector(sel);
          if (el) el.textContent = txt;
        };
        const setVal = (sel, val) => {
          const el = metaOverlay.querySelector(sel);
          if (el) el.value = val;
        };
        setVal("#metaPriority", "Medium");
        setText("#metaPriorityValue", "Medium");
        setVal("#metaStatus", "Open");
        setText("#metaStatusValue", "Open");
        setVal("#metaDue", "");
        setText("#metaDueValue", "Add");

        metaOverlay.classList.add("visible");
        metaOverlay.classList.remove("hidden");
      }
      return;
    }

    // Inline-tools direct wiring for Location, Attendees, and Private
    if (t.closest && t.closest("#toolMeetingLocation")) {
      // Open Edit overlay and focus Location row/input
      const editOverlay = root.querySelector(".edit-overlay");
      if (editOverlay) {
        syncInlineToEdit(root);
        editOverlay.classList.add("visible");
        editOverlay.classList.remove("hidden");
        // Collapse all rows, then open location row and set aria-expanded
        editOverlay
          .querySelectorAll(".inline-picker-row")
          .forEach((r) => (r.hidden = true));
        editOverlay
          .querySelectorAll(".ios-list-item[aria-controls]")
          .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
        const row = editOverlay.querySelector("#locationPickerRow");
        if (row) row.hidden = false;
        const ctrlBtn = editOverlay.querySelector(
          '.ios-list-item[aria-controls="locationPickerRow"]'
        );
        if (ctrlBtn) ctrlBtn.setAttribute("aria-expanded", "true");
        const input = editOverlay.querySelector("#editLocationInput");
        if (input) {
          input.focus();
          input.select && input.select();
        }
        if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
      }
      return;
    }
    if (t.closest && t.closest("#toolMeetingAttendees")) {
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const current = addOverlay
        ?.querySelector("#meetingAttendeesValue")
        ?.textContent?.trim();
      const initial = current && current.toLowerCase() !== "add" ? current : "";
      const raw =
        window.prompt("Add attendees (comma separated)", initial || "") || "";
      const label = raw
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", ")
        : "";
      // Update Add overlay chip
      const chip =
        addOverlay && addOverlay.querySelector("#meetingAttendeesValue");
      if (chip) {
        chip.textContent = label || "Add";
        chip.classList.toggle("placeholder", !label);
      }
      // Sync to Edit overlay hidden and placeholder
      const edit = root.querySelector(".edit-overlay");
      if (edit) {
        const hidden = edit.querySelector("#editAttendees");
        const ph = edit.querySelector("#editAttendeesPlaceholder");
        if (hidden) hidden.value = label;
        if (ph) ph.textContent = label || "Add";
      }
      scheduleAutoSave(root);
      return;
    }
    if (t.closest && t.closest("#toolMeetingPrivate")) {
      const chip = root.querySelector(
        "#addMeetingOverlay #meetingPrivateValue"
      );
      const current = (chip && chip.textContent.trim().toLowerCase()) || "off";
      const nextOn = current !== "on";
      if (chip) chip.textContent = nextOn ? "On" : "Off";
      // Sync switch in Edit overlay
      const edit = root.querySelector(".edit-overlay");
      const sw = edit && edit.querySelector("#editPrivate");
      if (sw) sw.checked = nextOn;
      scheduleAutoSave(root);
      return;
    }

    // Toggle select/deselect a tag option inside tags overlay
    if (
      t.closest &&
      t.closest(".tags-overlay #taTagsChips .tag-chip.selectable")
    ) {
      const sheet = root.querySelector(".tags-overlay");
      const chip = t.closest(".tag-chip.selectable");
      if (sheet && chip) {
        const label = (chip.dataset.tag || chip.textContent || "")
          .trim()
          .toLowerCase();
        const set = tagsOverlay_getSelectedSet(sheet);
        const willSelect = !set.has(label);
        if (willSelect) set.add(label);
        else set.delete(label);
        tagsOverlay_setSelectedSet(sheet, set);
        chip.classList.toggle("selected", willSelect);
        chip.setAttribute("aria-selected", willSelect ? "true" : "false");
        tagsOverlay_syncToAdd(root, sheet);
      }
      return;
    }
  });

  // Handle file input changes for attachments (attachments overlay)
  root.addEventListener(
    "change",
    (e) => {
      const el = e.target;
      if (el && el.id === "attFileInput") {
        const sheet = root.querySelector(".attachments-overlay");
        const list = sheet && sheet.querySelector("#attFilesList");
        if (!list) return;
        const current = Array.from(list.querySelectorAll(".name")).map(
          (n) => n.textContent || ""
        );
        const files = Array.from(el.files || []).map((f) => f.name);
        const merged = Array.from(new Set([...current, ...files])).filter(
          Boolean
        );
        list.innerHTML = merged
          .map(
            (n) =>
              `<li class="attachment-item"><span class="name">${escapeHTML(
                n
              )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
                n
              )}">Remove</button></li>`
          )
          .join("");
        el.value = ""; // allow re-selecting same file
        // Reflect to Add overlay immediately and auto-save
        const addOverlay = root.querySelector("#addMeetingOverlay");
        if (addOverlay) {
          renderAttachmentsList(addOverlay, merged);
          toggleAddButtonsByList(addOverlay);
        }
        scheduleAutoSave(root);
      }
      // Auto-save when Private switch is toggled in Edit overlay, and reflect chip immediately
      if (el && el.id === "editPrivate") {
        const addOverlay = root.querySelector("#addMeetingOverlay");
        const chip =
          addOverlay && addOverlay.querySelector("#meetingPrivateValue");
        if (chip) chip.textContent = el.checked ? "On" : "Off";
        try {
          scheduleAutoSave(root);
        } catch {}
      }
    },
    true
  );

  // Live-sync location input edits to hidden value, edit label, Add overlay chip, and autosave
  root.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (el && el.id === "editLocationInput") {
        const edit = root.querySelector(".edit-overlay");
        if (edit) {
          const hidden = edit.querySelector("#editLocation");
          const ph = edit.querySelector("#editLocationPlaceholder");
          const val = (el.value || "").trim();
          if (hidden) hidden.value = val;
          if (ph) ph.textContent = val ? val : "Add";
        }
        const addOverlay = root.querySelector("#addMeetingOverlay");
        const chip =
          addOverlay && addOverlay.querySelector("#meetingLocationValue");
        if (chip) {
          const val = (el.value || "").trim();
          chip.textContent = val ? val : "Add";
          chip.classList.toggle("placeholder", !val);
        }
        try {
          scheduleAutoSave(root);
        } catch {}
      }
    },
    true
  );

  // Also commit on blur for robustness
  root.addEventListener(
    "change",
    (e) => {
      const el = e.target;
      if (el && el.id === "editLocationInput") {
        const val = (el.value || "").trim();
        const edit = root.querySelector(".edit-overlay");
        if (edit) {
          const hidden = edit.querySelector("#editLocation");
          const ph = edit.querySelector("#editLocationPlaceholder");
          if (hidden) hidden.value = val;
          if (ph) ph.textContent = val ? val : "Add";
        }
        const addOverlay = root.querySelector("#addMeetingOverlay");
        const chip =
          addOverlay && addOverlay.querySelector("#meetingLocationValue");
        if (chip) {
          chip.textContent = val ? val : "Add";
          chip.classList.toggle("placeholder", !val);
        }
        try {
          scheduleAutoSave(root);
        } catch {}
      }
    },
    true
  );

  // Add tag via button in tags overlay
  root.addEventListener(
    "click",
    (e) => {
      if ((e.target && e.target.id) !== "taAddTagBtn") return;
      const sheet = root.querySelector(".tags-overlay");
      const input = sheet && sheet.querySelector("#taTagInput");
      const wrap = sheet && sheet.querySelector("#taTagsChips");
      if (!input || !wrap) return;
      const raw = (input.value || "").trim();
      if (!raw) return;
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing = Array.from(
        wrap.querySelectorAll(".tag-chip .label")
      ).map((n) => n.textContent || "");
      const merged = Array.from(new Set([...existing, ...parts]));
      wrap.innerHTML = merged
        .map(
          (t) =>
            `<span class="tag-chip removable"><span class="label">${escapeHTML(
              t
            )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
              t
            )}">×</button></span>`
        )
        .join("");
      input.value = "";
      input.focus && input.focus();
      // Reflect to Add overlay immediately and auto-save
      const addOverlay = root.querySelector("#addMeetingOverlay");
      if (addOverlay) {
        renderTagsList(addOverlay, merged);
        toggleAddButtonsByList(addOverlay);
      }
      scheduleAutoSave(root);
    },
    true
  );

  // Save handlers for Tags and Attachments overlays
  root.addEventListener(
    "submit",
    (e) => {
      const form = e.target;

      // Save Follow Up (Meta) overlay -> write back to Add overlay, and always show the Follow Up card
      if (form && form.closest && form.closest("#edit-meta-form")) {
        e.preventDefault();
        const metaOverlay = root.querySelector(".meta-edit-overlay");
        const addOverlay = root.querySelector("#addMeetingOverlay");
        if (metaOverlay && addOverlay) {
          const pr = metaOverlay.querySelector("#metaPriority")?.value || "";
          const st = metaOverlay.querySelector("#metaStatus")?.value || "";
          const dueISO = metaOverlay.querySelector("#metaDue")?.value || "";
          const assignedVal =
            metaOverlay.querySelector("#metaAssigned")?.value || "";
          const dueLabel = dueISO
            ? (() => {
                const d = parseISOToDate(dueISO);
                return d ? formatMeetingDate(d) : "";
              })()
            : "";

          // Update chips on Add overlay
          const setChip = (meta, value, placeholder) => {
            const chipVal = addOverlay.querySelector(
              `.meta-chip[data-meta="${meta}"] .chip-value`
            );
            if (!chipVal) return;
            if (value) {
              chipVal.textContent = value;
              chipVal.classList.remove("placeholder");
            } else {
              chipVal.textContent = placeholder;
              chipVal.classList.add("placeholder");
            }
            if (meta === "priority") {
              setPriorityChipClassOnOverlay(addOverlay, value);
            }
          };

          setChip("priority", pr, "Priority");
          setChip("status", st, "Status");
          setChip("due", dueLabel, "Due");
          setChip("assigned", assignedVal, "Assigned");

          // Reveal Follow Up card and hide the card by default
          const fCard = addOverlay.querySelector("#followUpCard");
          const addBtn = addOverlay.querySelector("#addFollowUpBtn");
          setHidden(fCard, false);
          setHidden(addBtn, true);
        }
        // Close overlay
        if (metaOverlay) {
          metaOverlay.classList.remove("visible");
          metaOverlay.classList.add("hidden");
        }
        // Auto-save meta changes
        try {
          scheduleAutoSave(root);
        } catch {}
        return;
      }

      // Save Tags overlay -> sync selected option chips (not all), then close
      if (form && form.closest && form.closest("#edit-tags-form")) {
        e.preventDefault();
        const sheet = root.querySelector(".tags-overlay");
        if (sheet) tagsOverlay_syncToAdd(root, sheet);
        if (sheet) {
          sheet.classList.remove("visible");
          sheet.classList.add("hidden");
        }
        return;
      }

      if (form && form.closest && form.closest("#edit-attachments-form")) {
        e.preventDefault();
        const sheet = root.querySelector(".attachments-overlay");
        const addOverlay = root.querySelector("#addMeetingOverlay");
        const files = Array.from(
          sheet.querySelectorAll("#attFilesList .attachment-item .name")
        ).map((n) => (n.textContent || "").trim());
        if (addOverlay) {
          renderAttachmentsList(addOverlay, files);
          syncAddInlineUI(addOverlay);
        }
        if (sheet) {
          sheet.classList.remove("visible");
          sheet.classList.add("hidden");
        }
        toggleAddButtonsByList(addOverlay);
        scheduleAutoSave(root);
        return;
      }
      if (form && form.closest && form.closest("#edit-log-meeting-form")) {
        e.preventDefault();
        try {
          saveEditToInline(root);
        } catch (err) {
          console.warn("[LogMeeting] saveEditToInline failed", err);
        }
        const editOverlay = root.querySelector(".edit-overlay");
        if (editOverlay) {
          editOverlay.classList.remove("visible");
          editOverlay.classList.add("hidden");
          // collapse any inline pickers
          editOverlay
            .querySelectorAll(".inline-picker-row:not([hidden])")
            .forEach((row) => (row.hidden = true));
          editOverlay
            .querySelectorAll(".ios-list-item[aria-controls]")
            .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
        }
        const addOverlay = root.querySelector("#addMeetingOverlay");
        if (addOverlay) {
          addOverlay.classList.add("visible");
          addOverlay.classList.remove("hidden");
          syncAddInlineUI(addOverlay);
        }
        if (typeof updateBodyScrollLock === "function") updateBodyScrollLock();
        toggleAddButtonsByList(addOverlay);
        scheduleAutoSave(root);
        return;
      }

      // Quick Add form submit
      if (form && form.closest && form.closest("#quick-add-form")) {
        e.preventDefault();
        saveQuickAddMeeting(root);
        return;
      }
    },
    true
  );

  // Auto-save when typing title or notes in Add overlay
  root.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!el) return;
      if (
        el.id === "meetingTitle" ||
        el.id === "quickNotes" ||
        el.id === "detailedNotes"
      ) {
        scheduleAutoSave(root);
      }
    },
    true
  );

  // Enter-to-add tag in Tags overlay input, then auto-save
  root.addEventListener(
    "keydown",
    (e) => {
      const el = e.target;
      if (!el || el.id !== "taTagInput" || e.key !== "Enter") return;
      e.preventDefault();
      const sheet = root.querySelector(".tags-overlay");
      const wrap = sheet && sheet.querySelector("#taTagsChips");
      const input = sheet && sheet.querySelector("#taTagInput");
      if (!wrap || !input) return;
      const raw = (input.value || "").trim();
      if (!raw) return;
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing = Array.from(
        wrap.querySelectorAll(".tag-chip .label")
      ).map((n) => n.textContent || "");
      const merged = Array.from(new Set([...existing, ...parts]));
      wrap.innerHTML = merged
        .map(
          (t) =>
            `<span class="tag-chip removable"><span class="label">${escapeHTML(
              t
            )}</span><button type="button" class="remove" aria-label="Remove ${escapeHTML(
              t
            )}">×</button></span>`
        )
        .join("");
      input.value = "";
      // Reflect to Add overlay immediately and auto-save
      const addOverlay = root.querySelector("#addMeetingOverlay");
      if (addOverlay) {
        renderTagsList(addOverlay, merged);
        toggleAddButtonsByList(addOverlay);
      }
      scheduleAutoSave(root);
    },
    true
  );

  // Keyboard support for rating stars (Enter/Space) -> auto-save
  root.addEventListener(
    "keydown",
    (e) => {
      const btn =
        e.target &&
        e.target.closest &&
        e.target.closest(".rating-section .rating-star");
      if (!btn) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const addOverlay = root.querySelector("#addMeetingOverlay");
      const v = parseInt(btn.getAttribute("data-value") || "0", 10) || 0;
      setRatingUI(addOverlay, v);
      scheduleAutoSave(root);
    },
    true
  );

  // Filter options as the user types in search
  root.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!el || el.id !== "taTagSearch") return;
      const sheet = root.querySelector(".tags-overlay");
      if (!sheet) return;
      tagsOverlay_renderOptions(sheet, undefined, el.value || "");
    },
    true
  );

  // Enter key in search adds the tag and selects it
  root.addEventListener(
    "keydown",
    (e) => {
      const el = e.target;
      if (!el || el.id !== "taTagSearch" || e.key !== "Enter") return;
      e.preventDefault();
      const sheet = root.querySelector(".tags-overlay");
      if (!sheet) return;
      const q = (el.value || "").trim().toLowerCase();
      if (!q) return;
      const set = tagsOverlay_getSelectedSet(sheet);
      set.add(q);
      tagsOverlay_setSelectedSet(sheet, set);
      pushRecentTag(q);
      el.value = "";
      tagsOverlay_renderRecent(sheet);
      tagsOverlay_renderOptions(sheet, undefined, "");
      tagsOverlay_syncToAdd(root, sheet);
    },
    true
  );

  root.dataset.delegateWired = "1";
}

// Build a reusable sample set for seeding
function getSampleMeetings() {
  return [
    {
      id: "seed1",
      title: "Legislative Aide Briefing – Appropriations",
      type: "In Person",
      date: "10/01/2025",
      start: "09:00",
      end: "09:45",
      duration: "45m",
      location: "Rayburn 2360",
      attendees: "Jane Doe (Legislative Aide), You",
      priority: "High",
      status: "In Progress",
      due: "10/05/2025",
      notes: "Discussed topline numbers, community project funding guidance.",
      rating: 5,
      pinned: true,
    },
    {
      id: "seed2",
      title: "Committee Hearing Prep – Energy & Commerce",
      type: "Virtual",
      date: "09/30/2025",
      start: "14:00",
      end: "15:00",
      duration: "1h",
      location: "Zoom",
      attendees: "Policy Team, Counsel",
      priority: "High",
      status: "Open",
      due: "10/03/2025",
      notes: "Draft opening statement, identify potential Q&A lines.",
      rating: 4,
      pinned: true,
    },
    {
      id: "seed3",
      title: "Tech Policy Briefing – Industry Coalition",
      type: "In Person",
      date: "09/29/2025",
      start: "11:30",
      end: "12:15",
      duration: "45m",
      location: "Capitol Visitor Center",
      attendees: "Industry Coalition Reps",
      priority: "Medium",
      status: "Open",
      due: "10/10/2025",
      notes: "Privacy framework updates; broadband deployment maps.",
      rating: 3,
      pinned: false,
    },
    {
      id: "seed4",
      title: "Constituent Town Hall – Planning Call",
      type: "Phone",
      date: "09/28/2025",
      start: "10:00",
      end: "10:30",
      duration: "30m",
      location: "Phone",
      attendees: "District Director, Scheduler",
      priority: "Medium",
      status: "In Progress",
      due: "10/07/2025",
      notes: "Venue hold, ADA access, live stream vendor.",
      pinned: false,
    },
    {
      id: "seed5",
      title: "Press Secretary Briefing",
      type: "Virtual",
      date: "09/27/2025",
      start: "16:00",
      end: "16:30",
      duration: "30m",
      location: "Teams",
      location: "Teams",
      attendees: "Press Sec, Comms Aide",
      priority: "Medium",
      status: "Open",
      due: "10/02/2025",
      notes: "Media inquiries on appropriations timeline.",
      pinned: false,
    },
    {
      id: "seed6",
      title: "Healthcare Bill – Policy Director",
      type: "In Person",
      date: "09/26/2025",
      start: "13:00",
      end: "13:50",
      duration: "50m",
      location: "Longworth 1310",
      attendees: "John Smith (Policy Director)",
      priority: "High",
      status: "In Progress",
      due: "10/06/2025",
      notes: "Score impact, stakeholder letters, whip count.",
      pinned: false,
    },
    {
      id: "seed7",
      title: "Capitol Walk-and-Talk – Member",
      type: "In Person",
      date: "09/25/2025",
      start: "17:10",
      end: "17:30",
      duration: "20m",
      location: "Capitol",
      attendees: "Member, Chief of Staff",
      priority: "Medium",
      status: "Closed",
      due: "",
      notes: "Confirm position on amendment package.",
      pinned: true,
    },
    {
      id: "seed8",
      title: "Think Tank Roundtable – Fiscal Outlook",
      type: "Virtual",
      date: "09/24/2025",
      start: "09:30",
      end: "10:30",
      duration: "1h",
      location: "Zoom",
      attendees: "Brookings, AEI reps",
      priority: "Low",
      status: "Open",
      due: "10/12/5",
      notes: "Charts requested for social post.",
      pinned: false,
    },
    {
      id: "seed9",
      title: "Background Call – Reporter",
      type: "Phone",
      date: "09/23/2025",
      start: "15:00",
      end: "15:20",
      duration: "20m",
      location: "Phone",
      attendees: "Reporter (Off the record)",
      priority: "Low",
      status: "Closed",
      due: "",
      notes: "Context on markup schedule.",
      pinned: false,
    },
    {
      id: "seed10",
      title: "Advocacy Group – Climate Priorities",
      type: "In Person",
      date: "09/22/2025",
      start: "12:00",
      end: "12:45",
      duration: "45m",
      location: "Cannon 122",
      attendees: "NGO Coalition",
      priority: "Medium",
      status: "Open",
      due: "10/09/2025",
      notes: "Follow-up on letter signers.",
      pinned: false,
    },
    {
      id: "seed11",
      title: "Budget Markup – Strategy Huddle",
      type: "Virtual",
      date: "09/21/2025",
      start: "08:30",
      end: "09:00",
      duration: "30m",
      location: "Webex",
      attendees: "Budget Staff, Floor Team",
      priority: "High",
      status: "In Progress",
      due: "10/04/2025",
      notes: "Amendment order and talking points.",
      pinned: false,
    },
    {
      id: "seed12",
      title: "Cross-Agency Coordination – Grants",
      type: "Virtual",
      date: "09/20/2025",
      start: "11:00",
      end: "11:40",
      duration: "40m",
      location: "Teams",
      attendees: "DOT, DOE staff",
      priority: "Medium",
      status: "Open",
      due: "10/15/2025",
      notes: "Match requirements and timelines.",
      pinned: false,
    },
    {
      id: "seed13",
      title: "Donor Outreach Call",
      type: "Phone",
      date: "09/19/2025",
      start: "18:00",
      end: "18:20",
      duration: "20m",
      location: "Phone",
      attendees: "Finance Director",
      priority: "Low",
      status: "Open",
      due: "",
      notes: "Invite to district event.",
      pinned: false,
    },
    {
      id: "seed14",
      title: "Drafting Session – Speechwriter",
      type: "Virtual",
      date: "09/18/2025",
      start: "13:15",
      end: "14:00",
      duration: "45m",
      location: "Google Meet",
      attendees: "Speechwriter, Comms",
      priority: "Medium",
      status: "In Progress",
      due: "10/01/2025",
      notes: "District manufacturing spotlight paragraph.",
      pinned: false,
    },
    {
      id: "seed15",
      title: "Vote Count – Party Whip Check-in",
      type: "In Person",
      date: "09/17/2025",
      start: "17:45",
      end: "18:05",
      duration: "20m",
      location: "Capitol",
      attendees: "Whip Team",
      priority: "High",
      status: "Closed",
      due: "",
      notes: "Whip count trending favorable.",
      pinned: false,
    },
  ];
}

function seedSampleMeetingsIfEmpty() {
  const existing = readMeetings();
  if (existing && existing.length) return;
  writeMeetings(getSampleMeetings());
}

// Dev seeding/clearing helpers
function refreshMeetingsUI(root) {
  const pinnedList = root.querySelector(".meeting-logs.pinned-meetings");
  const recentList = root.querySelector(".meeting-logs.recent-meetings");
  if (pinnedList) pinnedList.innerHTML = "";
  if (recentList) recentList.innerHTML = "";
  renderStoredMeetings(root);
  applyMeetingsSearchFilter(root);
}
function seedMeetings(forceReplace = false) {
  const existing = readMeetings();
  if (forceReplace || !existing || existing.length === 0) {
    writeMeetings(getSampleMeetings());
    return getSampleMeetings().length;
  }
  return existing.length;
}
function clearMeetings() {
  writeMeetings([]);
}

function resetAddMeetingOverlay(addOverlay) {
  // Clear edit target
  delete addOverlay.dataset.editingCardId;

  // Title
  const titleInput = addOverlay.querySelector("#meetingTitle");
  if (titleInput) titleInput.value = "";
  // Location (inline)
  const locInput = addOverlay.querySelector("#meetingLocationInput");
  if (locInput) locInput.value = "";

  // Inline tools (defaults will be set by FAB after reset)
  const typeEl = addOverlay.querySelector("#meetingTypeValue");
  const dateEl = addOverlay.querySelector("#meetingDateValue");
  const timeEl = addOverlay.querySelector("#meetingTimeValue");
  if (typeEl) typeEl.textContent = "Virtual";
  if (dateEl) dateEl.textContent = "";
  if (timeEl) timeEl.textContent = "";

  // Hidden fields
  const setVal = (sel, val = "") => {
    const el = addOverlay.querySelector(sel);
    if (el) el.value = val;
  };
  setVal("#editType", "");
  setVal("#editDate", "");
  setVal("#editStart", "");
  setVal("#editEnd", "");
  setVal("#editLocation", "");
  setVal("#editAttendees", "");
  // Reset inline labels for new fields
  const locInline = addOverlay.querySelector("#meetingLocationValue");
  if (locInline) locInline.textContent = "Add";
  const attInline = addOverlay.querySelector("#meetingAttendeesValue");
  if (attInline) attInline.textContent = "Add";
  const privInline = addOverlay.querySelector("#meetingPrivateValue");
  if (privInline) privInline.textContent = "Off";

  // Notes + counters
  const resetTextarea = (id) => {
    const ta = addOverlay.querySelector(`#${id}`);
    if (ta) ta.value = "";
    const counter = addOverlay.querySelector(`.char-counter[data-for="${id}"]`);
    if (ta && counter) {
      const max = parseInt(ta.getAttribute("data-max") || "0", 10);
      counter.textContent = max ? `${max} Characters left` : "";
    }
  };
  resetTextarea("quickNotes");
  resetTextarea("detailedNotes");

  // Meta chips placeholders
  const applyChip = (meta, label) => {
    const chipVal = addOverlay.querySelector(
      `.meta-chip[data-meta="${meta}"] .chip-value`
    );
    if (chipVal) {
      chipVal.textContent = label;
      chipVal.classList.add("placeholder");
    }
  };
  applyChip("priority", "Priority");
  setPriorityChipClassOnOverlay(addOverlay, "");

  applyChip("status", "Status");
  applyChip("due", "Due");

  // Rating
  const ratingHidden = addOverlay.querySelector("#meetingRatingValue");
  if (ratingHidden) ratingHidden.value = "0";
  setRatingUI(addOverlay, 0);

  // Hide inline date row
  const addDateRow = addOverlay.querySelector("#addInlineDateRow");
  if (addDateRow) addDateRow.hidden = true;

  // Follow Up: show the add button and hide the card by default
  const addBtn = addOverlay.querySelector("#addFollowUpBtn");
  const card = addOverlay.querySelector("#followUpCard");
  setHidden(addBtn, false);
  setHidden(card, true);

  // Tags & Attachments reset
  setVal("#editTags", "");
  setVal("#editAttachments", "");
  renderTagsList(addOverlay, []);
  renderAttachmentsList(addOverlay, []);
  toggleAddButtonsByList(addOverlay);
}

// Debounced auto-save for Add overlay
let __logMeeting_autoSaveTimer = 0;
function syncInlineInputsToHidden(root) {
  try {
    const addOverlay = root.querySelector("#addMeetingOverlay");
    const edit = root.querySelector(".edit-overlay");
    if (!addOverlay || !edit) return;
    const locInput = addOverlay.querySelector("#meetingLocationInput");
    if (locInput) {
      const hidden = edit.querySelector("#editLocation");
      if (hidden) hidden.value = (locInput.value || "").trim();
    }
  } catch {}
}
function scheduleAutoSave(root) {
  try {
    if (__logMeeting_autoSaveTimer) clearTimeout(__logMeeting_autoSaveTimer);
    __logMeeting_autoSaveTimer = setTimeout(() => {
      try {
        // Ensure inline inputs are mirrored to hidden fields before saving
        syncInlineInputsToHidden(root);
        // Persist current form to card/storage without closing or re-sorting
        saveMeetingFromForm(root, {
          closeOverlay: false,
          reapplyFilter: false,
          resort: false,
        });
      } catch (e) {
        console.warn("[LogMeeting] Auto-save failed", e);
      }
    }, 500);
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  const logMeetingOverlayContainer =
    document.getElementById("logMeetingOverlay");

  // Open main Log a Meeting overlay from Tools grid card (by title)
  const logMeetingButton = Array.from(
    document.querySelectorAll(".tool-card")
  ).find((card) => {
    const title = card.querySelector(".tool-title");
    return title && title.textContent.trim() === "Log a Meeting";
  });
  if (logMeetingButton && !logMeetingButton.dataset.wired) {
    logMeetingButton.addEventListener("click", () =>
      toggleLogMeetingOverlay(true)
    );
    logMeetingButton.dataset.wired = "1";
  }

  if (!logMeetingOverlayContainer) return;

  // Inject overlay HTML (sanitized)
  fetch("log-meeting-overlay.html")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load overlay content");
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc.querySelectorAll("script").forEach((s) => s.remove());
      logMeetingOverlayContainer.innerHTML = doc.body.innerHTML;

      // Ensure rating stars have proper roles initially
      const addOverlay =
        logMeetingOverlayContainer.querySelector("#addMeetingOverlay");
      if (addOverlay)
        setRatingUI(
          addOverlay,
          parseInt(
            addOverlay.querySelector("#meetingRatingValue")?.value || "0",
            10
          )
        );

      // Wire search
      wireSearchField(logMeetingOverlayContainer);

      // Wire sort control
      wireSortControl(logMeetingOverlayContainer);

      // Expose dev helpers
      window.seedMeetings = (force = false) => {
        const n = seedMeetings(force);
        refreshMeetingsUI(logMeetingOverlayContainer);
        return n;
      };
      window.clearMeetings = () => {
        clearMeetings();
        refreshMeetingsUI(logMeetingOverlayContainer);
      };
      window.refreshMeetingsUI = () =>
        refreshMeetingsUI(logMeetingOverlayContainer);

      // Seed 15 sample meetings if none exist, then render
      seedSampleMeetingsIfEmpty();
      renderStoredMeetings(logMeetingOverlayContainer);
      applyMeetingsSearchFilter(logMeetingOverlayContainer);
      // Apply initial sort order
      const sortSel = logMeetingOverlayContainer.querySelector("#recentSort");
      if (sortSel)
        sortRecentList(logMeetingOverlayContainer, sortSel.value || "newest");

      // Main overlay back/close
      const mainCloseBtn = logMeetingOverlayContainer.querySelector(
        ".side-overlay-header .close-btn"
      );
      if (mainCloseBtn && !mainCloseBtn.dataset.wired) {
        mainCloseBtn.addEventListener("click", () =>
          toggleLogMeetingOverlay(false)
        );
        mainCloseBtn.dataset.wired = "1";
      }

      // FAB -> open Quick Add overlay with simplified fields
      const fab = logMeetingOverlayContainer.querySelector(".fab-button");
      if (fab && !fab.dataset.wired) {
        fab.addEventListener("click", () => {
          // Clear Add overlay state before starting a new flow
          const addOverlayEl =
            logMeetingOverlayContainer.querySelector("#addMeetingOverlay");
          if (addOverlayEl) resetAddMeetingOverlay(addOverlayEl);
          openQuickAddOverlay(logMeetingOverlayContainer);
        });
        fab.dataset.wired = "1";
      }

      // Delegated handlers for any buttons inside injected content
      wireOverlayEventDelegation(logMeetingOverlayContainer);

      // Wire character counters for textareas with data-max
      wireCharCounters(logMeetingOverlayContainer);
    })
    .catch((err) => {
      console.warn("[LogMeeting] overlay fetch failed", err);
    });
});

function wireCharCounters(root) {
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!addOverlay) return;
  const textareas = addOverlay.querySelectorAll("textarea[data-max]");
  textareas.forEach((ta) => {
    const update = () => {
      const max = parseInt(ta.getAttribute("data-max") || "0", 10);
      const left = Math.max(0, max - (ta.value || "").length);
      const counter = addOverlay.querySelector(
        `.char-counter[data-for="${ta.id}"]`
      );
      if (counter) counter.textContent = `${left} Characters left`;
    };
    ta.addEventListener("input", update);
    update();
  });
}

function wireSortControl(root) {
  const sel = root.querySelector && root.querySelector("#recentSort");
  if (!sel || sel.dataset.wired) return;
  sel.addEventListener("change", () => {
    try {
      sortRecentList(root, sel.value || "newest");
    } catch (e) {
      console.warn("[LogMeeting] sortRecentList failed", e);
    }
  });
  sel.dataset.wired = "1";
}

function syncAddInlineUI(addOverlay) {
  if (!addOverlay) return;
  // Tags
  const tagsVal = addOverlay.querySelector("#editTags")?.value || "";
  renderTagsList(addOverlay, parseCSVList(tagsVal));
  // Attachments
  const attVal = addOverlay.querySelector("#editAttachments")?.value || "";
  renderAttachmentsList(addOverlay, parseCSVList(attVal));
  // Follow Up visibility based on chips and notes
  const prEl = addOverlay.querySelector(
    '.meta-chip[data-meta="priority"] .chip-value'
  );
  const stEl = addOverlay.querySelector(
    '.meta-chip[data-meta="status"] .chip-value'
  );
  const dueEl = addOverlay.querySelector(
    '.meta-chip[data-meta="due"] .chip-value'
  );
  const assignedEl = addOverlay.querySelector(
    '.meta-chip[data-meta="assigned"] .chip-value'
  );
  const hasPr = prEl && !prEl.classList.contains("placeholder");
  const hasSt = stEl && !stEl.classList.contains("placeholder");
  const hasDue = dueEl && !dueEl.classList.contains("placeholder");
  const hasAssigned =
    assignedEl && !assignedEl.classList.contains("placeholder");
  const notes = (
    addOverlay.querySelector("#detailedNotes")?.value || ""
  ).trim();
  const hasMeta = !!(hasPr || hasSt || hasDue || hasAssigned || notes);
  const fCard = addOverlay.querySelector("#followUpCard");
  const addBtn = addOverlay.querySelector("#addFollowUpBtn");
  setHidden(fCard, !hasMeta);
  setHidden(addBtn, hasMeta);
}

// Ensure Add buttons visibility matches lists/cards state (defensive)
function toggleAddButtonsByList(addOverlay) {
  if (!addOverlay) return;
  // Tags
  const tagsList = addOverlay.querySelector("#tagsList");
  const hasTags = !!(tagsList && tagsList.children && tagsList.children.length);
  const addTagsBtn = addOverlay.querySelector("#addTagsBtn");
  const editTagsBtn = addOverlay.querySelector("#editTagsBtn");
  const tagsSection = addOverlay.querySelector(".tags-section");
  setHidden(addTagsBtn, hasTags);
  setHidden(editTagsBtn, !hasTags);
  setHidden(tagsList, !hasTags);
  setHidden(tagsSection, !hasTags);
  // Attachments
  const attList = addOverlay.querySelector("#attachmentsList");
  const hasAtt = !!(attList && attList.children && attList.children.length);
  const addAttBtn = addOverlay.querySelector("#addAttachmentsBtn");
  const editAttBtn = addOverlay.querySelector("#editAttachmentsBtn");
  const attSection = addOverlay.querySelector(".attachments-section");
  setHidden(addAttBtn, hasAtt);
  setHidden(editAttBtn, !hasAtt);
  setHidden(attList, !hasAtt);
  setHidden(attSection, !hasAtt);
  // Follow Up
  const fCard = addOverlay.querySelector("#followUpCard");
  const addFU = addOverlay.querySelector("#addFollowUpBtn");
  const fuVisible = !!(fCard && !fCard.hidden);
  setHidden(addFU, fuVisible);
  setHidden(addFU, fuVisible);
}

// ===== Tags Overlay (Search + A–Z selectable chips with Recently used) =====
const RECENT_TAGS_KEY = "logMeeting.recentTags";
const DEFAULT_TAG_OPTIONS = [
  "Appropriations",
  "Budget",
  "Campaign",
  "Climate",
  "Communications",
  "Constituent",
  "Defense",
  "Digital",
  "District",
  "Economy",
  "Education",
  "Energy",
  "Environment",
  "Foreign Affairs",
  "Grants",
  "Healthcare",
  "Housing",
  "Immigration",
  "Infrastructure",
  "Judiciary",
  "Labor",
  "Legislation",
  "Oversight",
  "Press",
  "Regulatory",
  "Research",
  "Scheduling",
  "Small Business",
  "Tax",
  "Technology",
  "Transportation",
  "Veterans",
];
function readRecentTags() {
  try {
    const raw = localStorage.getItem(RECENT_TAGS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}
function writeRecentTags(arr) {
  try {
    localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(arr.slice(0, 12)));
  } catch {}
}
// Seed Recently used with 5 defaults if empty
function seedRecentTagsIfEmpty() {
  const curr = readRecentTags();
  if (curr && curr.length) return;
  // pick 5 common defaults
  const seed = [
    "budget",
    "technology",
    "education",
    "healthcare",
    "transportation",
  ];
  writeRecentTags(seed);
}
function pushRecentTag(tag) {
  const t = String(tag || "")
    .trim()
    .toLowerCase();
  if (!t) return;
  const curr = readRecentTags();
  const next = [t, ...curr.filter((x) => x !== t)];
  writeRecentTags(next);
}
function tagsOverlay_getSelectedSet(sheet) {
  try {
    const raw = sheet?.dataset?.selectedTags || "[]";
    const arr = JSON.parse(raw);
    return new Set(
      (Array.isArray(arr) ? arr : []).map((s) => String(s).toLowerCase())
    );
  } catch {
    return new Set();
  }
}
function tagsOverlay_setSelectedSet(sheet, set) {
  try {
    sheet.dataset.selectedTags = JSON.stringify(Array.from(set));
  } catch {}
}
function tagsOverlay_getSelected(sheet) {
  const sel = tagsOverlay_getSelectedSet(sheet);
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return Array.from(sel).map((s) => titleCase(s));
}
function tagsOverlay_renderOptions(sheet, _ignored, query) {
  try {
    const wrap = sheet.querySelector("#taTagsChips");
    if (!wrap) return;
    const selSet = tagsOverlay_getSelectedSet(sheet);
    const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
    const merged = Array.from(
      new Set([
        ...DEFAULT_TAG_OPTIONS,
        ...Array.from(selSet).map((s) => titleCase(s)),
      ])
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const q = (query || "").trim().toLowerCase();
    const filtered = q
      ? merged.filter((t) => t.toLowerCase().includes(q))
      : merged;
    wrap.innerHTML = filtered
      .map((t) => {
        const isSel = selSet.has(t.toLowerCase());
        return `<span class="tag-chip selectable${
          isSel ? " selected" : ""
        }" data-tag="${escapeHTML(t)}" role="option" aria-selected="${
          isSel ? "true" : "false"
        }"><span class="label">${escapeHTML(t)}</span></span>`;
      })
      .join("");
  } catch (e) {
    // silent fail
  }
}
function tagsOverlay_renderRecent(sheet) {
  const row = sheet.querySelector("#tagsRecentRow");
  const wrap = sheet.querySelector("#taRecentChips");
  if (!row || !wrap) return;
  const rec = readRecentTags();
  if (!rec.length) {
    row.hidden = true;
    wrap.innerHTML = "";
    return;
  }
  row.hidden = false;
  const sel = tagsOverlay_getSelectedSet(sheet);
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  wrap.innerHTML = rec
    .map((t) => {
      const isSel = sel.has(t);
      const label = titleCase(t);
      return `<span class="tag-chip selectable${
        isSel ? " selected" : ""
      }" data-tag="${escapeHTML(label)}" role="option" aria-selected="${
        isSel ? "true" : "false"
      }"><span class="label">${escapeHTML(label)}</span></span>`;
    })
    .join("");
}
function tagsOverlay_syncToAdd(root, sheet) {
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!addOverlay) return;
  const tags = tagsOverlay_getSelected(sheet);
  const hidden = addOverlay.querySelector("#editTags");
  if (hidden) hidden.value = (tags || []).join(", ");
  renderTagsList(addOverlay, tags);
  syncAddInlineUI(addOverlay);
  toggleAddButtonsByList(addOverlay);
  try {
    scheduleAutoSave(root);
  } catch {}
}
function openTagsOverlay(root) {
  const sheet = root.querySelector(".tags-overlay");
  const addOverlay = root.querySelector("#addMeetingOverlay");
  if (!sheet || !addOverlay) return;
  // Ensure Recently used has initial chips
  seedRecentTagsIfEmpty();
  const selectedArr = (addOverlay.querySelector("#editTags")?.value || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  tagsOverlay_setSelectedSet(sheet, new Set(selectedArr));
  const search = sheet.querySelector("#taTagSearch");
  if (search) search.value = "";
  tagsOverlay_renderRecent(sheet);
  tagsOverlay_renderOptions(sheet, undefined, "");
  sheet.classList.add("visible");
  sheet.classList.remove("hidden");
  setTimeout(() => search && search.focus && search.focus(), 50);
}
