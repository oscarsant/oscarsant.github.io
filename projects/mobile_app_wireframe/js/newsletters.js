const newsletters = [
  {
    id: 1,
    name: "Playbook",
    image:
      "https://static.politico.com/f3/ac/db44b04543beb00446e37bcabb05/20240814-playbook-cms-small-product-logo.jpg",
    description:
      "The unofficial guide to official Washington, every morning and weekday afternoons.",
    followed: false,
  },
  {
    id: 2,
    name: "West Wing Playbook: Remaking Government",
    image:
      "https://static.politico.com/38/0c/38185a8141e586fc282fcac7156e/20241106-west-wing-pb-transition-cms-small-product-logo.jpg",
    description:
      "Your guide to Donald Trump’s unprecedented overhaul of the federal government.",
    followed: false,
  },
  {
    id: 3,
    name: "Inside Congress",
    image:
      "https://static.politico.com/54/74/7bea9e1d46b5a862b803e60fa5c7/20250120-inside-congress-cms-small-product-logo-2.png",
    description: "Your first read on Capitol Hill politics and policy.",
    followed: false,
  },
  {
    id: 4,
    name: "POLITICO Nightly",
    image:
      "https://static.politico.com/8d/c3/ecdca35044da9ff1bbf02d81da1a/20240814-nightly-cms-small-product-logo.jpg",
    description:
      "Tomorrow’s conversation, tonight. Know where the news is going next.",
    followed: false,
  },
  {
    id: 5,
    name: "POLITICO Weekend",
    image:
      "https://static.politico.com/b4/74/4e1c45f34ead93a9b7a2c59b1200/politico-weekend-keyart-iso.png",
    description: "Even power needs a day off.",
    followed: false,
  },
  {
    id: 6,
    name: "California Playbook",
    image:
      "https://static.politico.com/6d/7f/c1d43def47828c7a7d454a48a315/20230609-politico-california-playbook-product-small-logo.png",
    description: "Inside the Golden State political arena",
    followed: false,
  },
  {
    id: 7,
    name: "California Playbook PM",
    image:
      "https://static.politico.com/6d/7f/c1d43def47828c7a7d454a48a315/20230609-politico-california-playbook-product-small-logo.png",
    description:
      "Your afternoon must-read briefing on politics and government in the Golden State",
    followed: false,
  },
  {
    id: 8,
    name: "Florida Playbook",
    image:
      "https://static.politico.com/2f/94/a40fbce04d8daf057cca004ea7f5/20240814-florida-playbook-cms-small-product-logo.jpg",
    description:
      "Kimberly Leonard's must-read briefing on what's hot, crazy or shady about politics in the Sunshine State",
    followed: false,
  },
  {
    id: 9,
    name: "Illinois Playbook",
    image:
      "https://static.politico.com/92/96/a75d9b7143faa544cfd931bf3e34/20240814-illinois-playbook-cms-small-product-logo.jpg",
    description:
      "Shia Kapos' must-read rundown of political news in the Land of Lincoln",
    followed: false,
  },
  {
    id: 10,
    name: "Massachusetts Playbook",
    image:
      "https://static.politico.com/9a/9d/80a0bc764cbba40e509ab4435f40/20240814-mass-playbook-cms-small-product-logo.jpg",
    description:
      "Kelly Garrity's must-read rundown of what's up on Beacon Hill and beyond.",
    followed: false,
  },
  {
    id: 11,
    name: "New Jersey Playbook",
    image:
      "https://static.politico.com/86/fd/c127c2054cbebca2380b1611d0f9/20240814-nj-playbook-cms-small-product-logo.jpg",
    description:
      "Matt Friedman's must-read briefing on the Garden State's important news of the day",
    followed: false,
  },
  {
    id: 12,
    name: "New York Playbook",
    image:
      "https://static.politico.com/22/91/3818823646d994abadf887b9991e/20240814-ny-playbook-cms-small-product-logo.jpg",
    description:
      "POLITICO's must-read briefing informing the daily conversation among knowledgeable New Yorkers",
    followed: false,
  },
  {
    id: 13,
    name: "New York Playbook PM",
    image:
      "https://static.politico.com/22/91/3818823646d994abadf887b9991e/20240814-ny-playbook-cms-small-product-logo.jpg",
    description:
      "Your afternoon must-read briefing informing the daily conversation among knowledgeable New Yorkers",
    followed: false,
  },
  {
    id: 14,
    name: "Canada Playbook",
    image:
      "https://static.politico.com/4e/d9/d41bd7e74c9dbba347d9be25f958/20250501-politico-canada-playbook-cms-small-product-logo.png",
    description: "A daily look inside Canadian politics and power.",
    followed: false,
  },
  {
    id: 15,
    name: "Global Playbook",
    image:
      "https://static.politico.com/57/0d/e1ee3af04519a1efb99d1dacfa07/20240814-global-playbook-general-cms-small-product-logo.jpg",
    description: "Your VIP pass to the world’s most influential gatherings.",
    followed: false,
  },
  {
    id: 16,
    name: "California Climate",
    image:
      "https://static.politico.com/6d/7f/c1d43def47828c7a7d454a48a315/20230609-politico-california-playbook-product-small-logo.png",
    description:
      "How the politics of climate change are shaping the future of California",
    followed: false,
  },
  {
    id: 17,
    name: "Digital Future Daily",
    image:
      "https://static.politico.com/a5/9a/570f22ec45b58438c541f7de799a/politico-digital-future-daily-cms.png",
    description:
      "How the next wave of technology is upending the global economy and its power structures",
    followed: false,
  },
  {
    id: 18,
    name: "Future Pulse",
    image:
      "https://static.politico.com/bf/46/75f18a854beaa954e6068a3f70a1/20240814-future-pulse-cms-small-product-logo.jpg",
    description: "The ideas and innovators shaping health care",
    followed: false,
  },
  {
    id: 19,
    name: "POLITICO Influence",
    image:
      "https://static.politico.com/6b/8a/8c87445a4221a92916b5e7602948/politico-influence-logo.png",
    description:
      "Delivered daily, Influence gives you a comprehensive rundown and analysis of all lobby hires and news on K Street.",
    followed: false,
  },
  {
    id: 20,
    name: "POLITICO Pro Space Preview",
    image:
      "https://static.politico.com/56/96/fb2b64ae45868d8f0a5db70f9c77/20250512-politico-space-cms-small-product-logo.png",
    description:
      "Available until August 22, this weekly newsletter preview will explore the people, policy fights and political battles behind America’s new space age.",
    followed: false,
  },
  {
    id: 21,
    name: "Morning Money",
    image:
      "https://static.politico.com/e5/3b/762f0af441e8829fddc93c84245e/morning-money-logo.png",
    description:
      "Delivered daily by 8 a.m., Morning Money examines the latest news in finance politics and policy.",
    followed: false,
  },
  {
    id: 22,
    name: "National Security Daily",
    image:
      "https://static.politico.com/65/6c/f7354a7841efa43107c5cfef2f47/20240814-politico-national-sec-daily-cms-small-product-logo.jpg",
    description:
      "From the SitRoom to the E-Ring, the inside scoop on defense, national security and foreign policy.",
    followed: false,
  },
  {
    id: 23,
    name: "Power Switch",
    image:
      "https://static.politico.com/8d/94/d0f52bac4fba98be4da2bad62d00/20240814-power-switch-cms-small-product-logo.jpg",
    description:
      "Your guide to the political forces shaping the energy transformation",
    followed: false,
  },
  {
    id: 24,
    name: "POLITICO Pulse",
    image:
      "https://static.politico.com/e9/e3/9a3d70284f64a210f32c61d581ce/pulse-logo.png",
    description:
      "Delivered daily by 10 a.m., Pulse examines the latest news in health care politics and policy.",
    followed: false,
  },
  {
    id: 25,
    name: "Prescription Pulse",
    image:
      "https://static.politico.com/d6/6f/800cc4be4a62ae2f46bda4c29902/prescription-pulse-logo.png",
    description:
      "Delivered every Tuesday and Friday by 12 p.m., Prescription Pulse examines the latest pharmaceutical news and policy.",
    followed: false,
  },
  {
    id: 26,
    name: "The Recast",
    image:
      "https://static.politico.com/ac/0e/cc4c8cfe418087bc65319192f621/20240814-the-recast-cms-small-product-logo.jpg",
    description:
      "How race and identity are shaping politics, policy and power.",
    followed: false,
  },
  {
    id: 27,
    name: "Women Rule",
    image:
      "https://static.politico.com/65/6b/f36abfc24c76a8484255e66d2734/20240814-womenrule-cms-small-product-logo.jpg",
    description: "Your definitive guide to women, politics and power.",
    followed: false,
  },
  {
    id: 28,
    name: "Weekly Agriculture",
    image:
      "https://static.politico.com/f3/73/4de0ad18452aa00036c5d4972081/morning-agriculture-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Agriculture examines the latest news in agriculture and food politics and policy.",
    followed: false,
  },
  {
    id: 29,
    name: "Weekly Cybersecurity",
    image:
      "https://static.politico.com/54/3b/e8c244524d6cbcdb3d0330a02c2c/morning-cybersecurity-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Cybersecurity examines the latest news in cybersecurity policy and politics.",
    followed: false,
  },
  {
    id: 30,
    name: "Weekly Education",
    image:
      "https://static.politico.com/09/f9/22dc0b4d472389082c2a5c818362/morning-education-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Education examines the latest news in education politics and policy.",
    followed: false,
  },
  {
    id: 31,
    name: "Weekly New York Health Care",
    image:
      "https://static.politico.com/85/d3/a91f768c4f71ae1ac0ed8bb01abb/ny-health-care-2.jpg",
    description:
      "Delivered every Monday by 10 a.m., New York Health Care is your guide to the week’s top health care news and policy in Albany and around the Empire State.",
    followed: false,
  },
  {
    id: 32,
    name: "Weekly New York & New Jersey Energy",
    image:
      "https://static.politico.com/57/7a/ca055e2f4f2797f2087f17b5c262/ny-nj-energy-2.jpg",
    description:
      "Delivered every Monday by 10 a.m., New York & New Jersey Energy is your guide to the week’s top energy news and policy in Albany and Trenton.",
    followed: false,
  },
  {
    id: 33,
    name: "Weekly Score",
    image:
      "https://static.politico.com/9b/f1/266315bc43ddab28a62557905add/morning-score-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Score is your guide to the year-round campaign cycle.",
    followed: false,
  },
  {
    id: 34,
    name: "Weekly Shift",
    image:
      "https://static.politico.com/5e/94/4654d570486eb0a2f2d744ec132f/morning-shift-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Shift examines the latest news in employment, labor and immigration politics and policy.",
    followed: false,
  },
  {
    id: 35,
    name: "Weekly Tax",
    image:
      "https://static.politico.com/5a/bb/cdc2d5884bb6b6bbc890b28a577b/morning-tax-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Tax examines the latest news in tax politics and policy.",
    followed: false,
  },
  {
    id: 36,
    name: "Weekly Trade",
    image:
      "https://static.politico.com/8e/08/9ae591fc4803ad116bcbed18a6e6/morning-trade-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Trade examines the latest news in global trade politics and policy.",
    followed: false,
  },
  {
    id: 37,
    name: "Weekly Transportation",
    image:
      "https://static.politico.com/b3/55/7b890a3b4086bcd213994563742f/morning-transportation-logo.png",
    description:
      "Delivered every Monday by 10 a.m., Weekly Transportation examines the latest news in transportation and infrastructure politics and policy.",
    followed: false,
  },
];

document.addEventListener("DOMContentLoaded", function () {
  const newsletterPage = document.querySelector(".newsletter-following-page");
  if (!newsletterPage) return;

  // Fallback utilities to avoid 503s on logos
  const getNewsletterFallback = (seed) =>
    `https://picsum.photos/seed/newsletter-${seed}/120/120`;
  const svgPlaceholder = (w = 120, h = 120, text = "Logo") => {
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
         <rect width='100%' height='100%' fill='#e5e7eb'/>
         <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
           fill='#6b7280' font-family='system-ui,-apple-system,Segoe UI,Roboto' font-size='12'>${text}</text>
       </svg>`
    );
    return `data:image/svg+xml,${svg}`;
  };
  const setImgWithFallback = (img, primary, fallback, label) => {
    img.src = primary;
    img.onerror = () => {
      img.onerror = () => {
        img.onerror = null;
        img.src = svgPlaceholder(
          img.width || 120,
          img.height || 120,
          label || "Logo"
        );
      };
      img.src = fallback;
    };
  };

  const followedList = document.getElementById("followed-list");
  const discoverList = document.getElementById("discover-list");

  let editMode = false;
  const editBtn = document.createElement("button");
  editBtn.className = "subscriptions-edit-btn";
  editBtn.addEventListener("click", function () {
    editMode = !editMode;
    // Add/remove the edit-mode class for animation
    const followedSection = document.querySelector(".followed-newsletters");
    if (followedSection) {
      if (editMode) {
        followedSection.classList.add("edit-mode");
      } else {
        followedSection.classList.remove("edit-mode");
      }
    }
    renderNewsletters();
  });

  function renderNewsletters() {
    followedList.innerHTML = "";
    discoverList.innerHTML = "";

    // Remove any existing empty message
    const emptyMsgEl = document.querySelector(".empty-followed-message");
    if (emptyMsgEl) emptyMsgEl.remove();

    // Insert the edit button to the right of the headline (only once)
    const subscriptionsHeader = document.querySelector(".subscriptions-header");
    if (
      subscriptionsHeader &&
      !subscriptionsHeader.querySelector(".subscriptions-edit-btn")
    ) {
      subscriptionsHeader.appendChild(editBtn);
    }
    editBtn.textContent = editMode ? "Done" : "Edit";

    let hasFollowed = false;
    newsletters.forEach((newsletter) => {
      // Followed list card (no description)
      if (newsletter.followed) {
        const followedLi = document.createElement("li");
        followedLi.innerHTML = `
                    <div class="newsletter-info">
                        <img class="newsletter-thumb" src="${
                          newsletter.image
                        }" alt="${newsletter.name} logo" />
                        <div class="newsletter-meta">
                            <h3>${newsletter.name}</h3>
                        </div>
                    </div>
                    ${
                      editMode
                        ? `<button class="remove-btn" title="Unfollow ${newsletter.name}">&times;</button>`
                        : ""
                    }
                `;
        // Apply image fallback
        const imgEl = followedLi.querySelector(".newsletter-thumb");
        if (imgEl) {
          setImgWithFallback(
            imgEl,
            newsletter.image,
            getNewsletterFallback(newsletter.id),
            newsletter.name
          );
        }
        // Add event listener for remove button
        if (editMode) {
          const removeBtn = followedLi.querySelector(".remove-btn");
          if (removeBtn) {
            removeBtn.addEventListener("click", () => {
              newsletter.followed = false;
              renderNewsletters();
            });
          }
        }
        // Add event listener to open overlay on click
        followedLi.addEventListener("click", function () {
          if (!editMode) {
            openNewsletterOverlay(newsletter);
          }
        });
        followedList.appendChild(followedLi);
        hasFollowed = true;
      }

      // Discover list card (always shows, button changes state)
      const discoverLi = document.createElement("li");
      discoverLi.innerHTML = `
                <div class="newsletter-info">
                    <img class="newsletter-thumb" src="${
                      newsletter.image
                    }" alt="${newsletter.name} logo" />
                    <div class="newsletter-meta">
                        <h3>${newsletter.name}</h3>
                        <p>${newsletter.description}</p>
                    </div>
                </div>
                <button class="primary-btn follow-btn ${
                  newsletter.followed ? "following" : ""
                }">
                    ${newsletter.followed ? "Subscribed" : "Subscribe"}
                </button>
            `;
      // Apply image fallback
      const discImgEl = discoverLi.querySelector(".newsletter-thumb");
      if (discImgEl) {
        setImgWithFallback(
          discImgEl,
          newsletter.image,
          getNewsletterFallback(newsletter.id),
          newsletter.name
        );
      }
      const followBtn = discoverLi.querySelector(".follow-btn");
      followBtn.addEventListener("click", () => toggleFollow(newsletter));
      const newsletterTitle = discoverLi.querySelector(".newsletter-info h3");
      newsletterTitle.addEventListener("click", function () {
        openNewsletterOverlay(newsletter);
      });
      discoverList.appendChild(discoverLi);
    });

    // Show empty message below header if no followed
    if (!hasFollowed) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "empty-followed-message";
      emptyMsg.textContent = "Your subscribed newsletters will show here.";
      // Insert after subscriptionsHeader, before followedList
      subscriptionsHeader.parentNode.insertBefore(emptyMsg, followedList);
    }
  }

  function toggleFollow(newsletter) {
    newsletter.followed = !newsletter.followed;
    renderNewsletters();
  }

  const newsletterContent = document.getElementById("newsletter-content");
  const originalNewsletterContent = newsletterContent.innerHTML;
  const newsletterOverlayContent = document.getElementById(
    "newsletter-overlay-content"
  );
  const originalNewsletterOverlayContent = newsletterOverlayContent.innerHTML;

  // Close overlay when clicking the back button
  const newsletterBackBtn = document.getElementById("newsletter-back-btn");
  if (newsletterBackBtn) {
    newsletterBackBtn.addEventListener("click", function () {
      const overlay = document.getElementById("newsletter-overlay");

      // Prevent double-triggering if already closing
      if (overlay.classList.contains("closing")) return;

      // Add closing class to trigger exit animation
      overlay.classList.add("closing");

      // Wait for 1s animation to complete before hiding
      setTimeout(() => {
        overlay.classList.remove("closing");
        overlay.style.display = "none";
        newsletterOverlayContent.innerHTML = originalNewsletterOverlayContent;
        renderNewsletters();
      }, 1000); // matches 1s animation duration in CSS
    });
  }

  const subscriptionsHeader = document.querySelector(".subscriptions-header");
  if (
    subscriptionsHeader &&
    !subscriptionsHeader.querySelector(".subscriptions-edit-btn")
  ) {
    subscriptionsHeader.appendChild(editBtn);
  }

  // Update the overlay to dynamically load the logo from the script
  const newsletterOverlay = document.getElementById("newsletter-overlay");
  const newsletterLogo = document.getElementById("newsletter-logo");
  const newsletterTitle = document.getElementById("newsletter-title");

  function openNewsletterOverlay(newsletter) {
    newsletterOverlay.style.display = "flex";
    newsletterTitle.textContent = newsletter.name;
    // Use fallback chain for overlay logo
    setImgWithFallback(
      newsletterLogo,
      newsletter.image,
      getNewsletterFallback(newsletter.id),
      newsletter.name
    );
    newsletterLogo.alt = `${newsletter.name} logo`;
  }

  // Attach event listeners to dynamically open the overlay with the correct logo
  newsletters.forEach((newsletter) => {
    const newsletterElement = document.querySelector(
      `[data-newsletter-id="${newsletter.id}"]`
    );
    if (newsletterElement) {
      newsletterElement.addEventListener("click", () =>
        openNewsletterOverlay(newsletter)
      );
    }
  });

  renderNewsletters();
});
