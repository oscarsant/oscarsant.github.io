document.addEventListener("DOMContentLoaded", function () {
  // Welcome message
  const welcomeMessage = document.getElementById("welcome-message");
  if (welcomeMessage) {
    welcomeMessage.textContent = "Welcome! Here are today's top stories.";
  }

  // News toggle handlers
  const topBtn = document.getElementById("top-news-btn");
  const latestBtn = document.getElementById("latest-news-btn");
  const topNewsFeed = document.getElementById("top-news-feed");
  const latestNewsFeed = document.getElementById("latest-news-feed");

  topBtn?.addEventListener("click", function () {
    topBtn.classList.add("active");
    latestBtn.classList.remove("active");
    topNewsFeed.style.display = "";
    latestNewsFeed.style.display = "none";
  });

  latestBtn?.addEventListener("click", function () {
    latestBtn.classList.add("active");
    topBtn.classList.remove("active");
    topNewsFeed.style.display = "none";
    latestNewsFeed.style.display = "";
  });

  // Toggle active state for news pills
  const newsPills = document.querySelectorAll("#news-pills .news-pill");
  newsPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      newsPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      // Optionally, filter news here based on pill text
    });
  });

  // Change News Images button
  const changeImagesBtn = document.getElementById("change-images-btn");
  if (changeImagesBtn) {
    changeImagesBtn.addEventListener("click", function () {
      document.querySelectorAll(".news-card-image img").forEach((img, i) => {
        img.src = `https://picsum.photos/seed/news${Math.floor(Math.random() * 1000)}/600/400`;
      });
    });
  }

});