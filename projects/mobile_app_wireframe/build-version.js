#!/usr/bin/env node
// build-version.js
// Replaces __BUILD_ID__ placeholders in index.html and sw.js with an auto-generated build identifier.
// Run: npm run build-version (add to CI/CD before deploy)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function getGitHash() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: "pipe" })
      .toString()
      .trim();
  } catch (_) {
    return null;
  }
}

function buildId() {
  const now = new Date();
  const dateStamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const timeStamp = [
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");
  const hash = getGitHash();
  return hash
    ? `${dateStamp}-${timeStamp}-${hash}`
    : `${dateStamp}-${timeStamp}`;
}

function getHumanReadableTimestamp() {
  const now = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${month} ${day}, ${year} ${hours}:${minutes}${ampm}`;
}

const BUILD_ID = buildId();
const HUMAN_TIMESTAMP = getHumanReadableTimestamp();
const files = ["index.html", "sw.js"];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, "utf8");

  // In sw.js, always replace the BUILD_ID line
  if (file === "sw.js") {
    const buildIdRegex = /const BUILD_ID = ".*";/;
    if (buildIdRegex.test(content)) {
      content = content.replace(
        buildIdRegex,
        `const BUILD_ID = "${BUILD_ID}";`
      );
      console.log(`[ok] Injected BUILD_ID=${BUILD_ID} into ${file}`);
    }
  }

  // Replace __BUILD_ID__ placeholders in other files (like index.html)
  if (content.includes("__BUILD_ID__")) {
    content = content.replace(/__BUILD_ID__/g, BUILD_ID);
    console.log(`[ok] Injected BUILD_ID=${BUILD_ID} into ${file}`);
  }

  // Replace human-readable timestamp placeholder (if present)
  if (file.endsWith(".html") && content.includes("__HUMAN_TIMESTAMP__")) {
    content = content.replace(/__HUMAN_TIMESTAMP__/g, HUMAN_TIMESTAMP);
    console.log(
      `[ok] Injected HUMAN_TIMESTAMP="${HUMAN_TIMESTAMP}" into ${file}`
    );
  }

  // Replace human-readable timestamps in login-build-timestamp spans (only for HTML files)
  if (file.endsWith(".html")) {
    const timestampRegex =
      /(<span id="login-build-timestamp">)[^<]*(<\/span>)/g;
    const matches = content.match(timestampRegex);
    if (matches) {
      content = content.replace(timestampRegex, `$1${HUMAN_TIMESTAMP}$2`);
      console.log(
        `[ok] Updated ${matches.length} timestamp(s) to "${HUMAN_TIMESTAMP}" in ${file}`
      );
    }
  }

  fs.writeFileSync(filePath, content);
});

// Write a text file with the last build id for reference
fs.writeFileSync(path.join(__dirname, "LAST_BUILD_ID.txt"), BUILD_ID + "\n");
console.log(`Done. BUILD_ID=${BUILD_ID}, Human Timestamp=${HUMAN_TIMESTAMP}`);
