const STORAGE_KEY = "social-scheduler-posts-v1";

const state = {
  posts: [],
  selectedId: null,
  captionPlatform: "instagram",
  view: "week",
  rangeDate: startOfWeek(new Date()),
  filters: {
    accounts: new Set(["instagram", "facebook"]),
    statuses: new Set(["Draft", "Review", "Scheduled", "Published"]),
    search: "",
    campaign: "all",
  },
};

const els = {
  calendarTitle: document.querySelector("#calendar-title"),
  weekGrid: document.querySelector("#week-grid"),
  monthGrid: document.querySelector("#month-grid"),
  prevRange: document.querySelector("#prev-range"),
  nextRange: document.querySelector("#next-range"),
  todayButton: document.querySelector("#today-button"),
  newPostButton: document.querySelector("#new-post-button"),
  bulkPostButton: document.querySelector("#bulk-post-button"),
  viewButtons: document.querySelectorAll("[data-view]"),
  accountFilters: document.querySelectorAll("[data-account-filter]"),
  statusFilters: document.querySelectorAll("[data-status-filter]"),
  searchInput: document.querySelector("#search-input"),
  campaignFilter: document.querySelector("#campaign-filter"),
  exportButton: document.querySelector("#export-button"),
  scheduledCount: document.querySelector("#scheduled-count"),
  reviewCount: document.querySelector("#review-count"),
  editorHeading: document.querySelector("#editor-heading"),
  duplicatePost: document.querySelector("#duplicate-post"),
  deletePost: document.querySelector("#delete-post"),
  previewPlatform: document.querySelector("#preview-platform"),
  previewMedia: document.querySelector("#preview-media"),
  previewTitle: document.querySelector("#preview-title"),
  previewCaption: document.querySelector("#preview-caption"),
  title: document.querySelector("#post-title"),
  caption: document.querySelector("#post-caption"),
  captionLabel: document.querySelector("#caption-label"),
  date: document.querySelector("#post-date"),
  time: document.querySelector("#post-time"),
  status: document.querySelector("#post-status"),
  format: document.querySelector("#post-format"),
  platformInstagram: document.querySelector("#platform-instagram"),
  platformFacebook: document.querySelector("#platform-facebook"),
  campaign: document.querySelector("#post-campaign"),
  tags: document.querySelector("#post-tags"),
  checkMedia: document.querySelector("#check-media"),
  checkLinks: document.querySelector("#check-links"),
  checkOwner: document.querySelector("#check-owner"),
  captionTabs: document.querySelectorAll("[data-caption-platform]"),
  scheduleButton: document.querySelector("#schedule-button"),
  saveDraftButton: document.querySelector("#save-draft-button"),
  mediaButtons: document.querySelectorAll("[data-media]"),
  metricReach: document.querySelector("#metric-reach"),
  metricLikes: document.querySelector("#metric-likes"),
  metricComments: document.querySelector("#metric-comments"),
  metricSaves: document.querySelector("#metric-saves"),
  bulkDialog: document.querySelector("#bulk-dialog"),
  bulkClose: document.querySelector("#bulk-close"),
  bulkCancel: document.querySelector("#bulk-cancel-button"),
  bulkCreate: document.querySelector("#bulk-create-button"),
  bulkLines: document.querySelector("#bulk-lines"),
  bulkStartDate: document.querySelector("#bulk-start-date"),
  bulkTimes: document.querySelector("#bulk-times"),
  bulkStatus: document.querySelector("#bulk-status"),
  bulkFormat: document.querySelector("#bulk-format"),
  bulkCampaign: document.querySelector("#bulk-campaign"),
  bulkMedia: document.querySelector("#bulk-media"),
  bulkPlatformInstagram: document.querySelector("#bulk-platform-instagram"),
  bulkPlatformFacebook: document.querySelector("#bulk-platform-facebook"),
  bulkPreviewCount: document.querySelector("#bulk-preview-count"),
  bulkPreviewRange: document.querySelector("#bulk-preview-range"),
};

function init() {
  state.posts = loadPosts();
  state.selectedId = state.posts[0]?.id ?? null;
  bindEvents();
  render();
}

function bindEvents() {
  els.prevRange.addEventListener("click", () => moveRange(-1));
  els.nextRange.addEventListener("click", () => moveRange(1));
  els.todayButton.addEventListener("click", () => {
    state.rangeDate = state.view === "month" ? startOfMonth(new Date()) : startOfWeek(new Date());
    render();
  });

  els.newPostButton.addEventListener("click", createPost);
  els.bulkPostButton.addEventListener("click", openBulkScheduler);
  els.duplicatePost.addEventListener("click", duplicateSelectedPost);
  els.deletePost.addEventListener("click", deleteSelectedPost);
  els.exportButton.addEventListener("click", exportCsv);
  els.bulkClose.addEventListener("click", closeBulkScheduler);
  els.bulkCancel.addEventListener("click", closeBulkScheduler);
  els.bulkCreate.addEventListener("click", createBulkPosts);

  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.rangeDate = state.view === "month" ? startOfMonth(state.rangeDate) : startOfWeek(state.rangeDate);
      render();
    });
  });

  els.accountFilters.forEach((input) => {
    input.addEventListener("change", () => {
      toggleSetValue(state.filters.accounts, input.dataset.accountFilter, input.checked);
      renderCalendar();
    });
  });

  els.statusFilters.forEach((input) => {
    input.addEventListener("change", () => {
      toggleSetValue(state.filters.statuses, input.dataset.statusFilter, input.checked);
      renderCalendar();
    });
  });

  els.searchInput.addEventListener("input", () => {
    state.filters.search = els.searchInput.value.trim().toLowerCase();
    renderCalendar();
  });

  els.campaignFilter.addEventListener("change", () => {
    state.filters.campaign = els.campaignFilter.value;
    renderCalendar();
  });

  els.captionTabs.forEach((button) => {
    button.addEventListener("click", () => {
      commitCaption();
      state.captionPlatform = button.dataset.captionPlatform;
      renderEditor();
    });
  });

  [
    els.title,
    els.caption,
    els.date,
    els.time,
    els.status,
    els.format,
    els.platformInstagram,
    els.platformFacebook,
    els.campaign,
    els.tags,
    els.checkMedia,
    els.checkLinks,
    els.checkOwner,
  ].forEach((input) => {
    input.addEventListener("input", updateSelectedFromForm);
    input.addEventListener("change", updateSelectedFromForm);
  });

  els.scheduleButton.addEventListener("click", () => {
    els.status.value = "Scheduled";
    updateSelectedFromForm();
  });

  els.saveDraftButton.addEventListener("click", () => {
    els.status.value = "Draft";
    updateSelectedFromForm();
  });

  els.mediaButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const post = selectedPost();
      if (!post) return;
      post.media = button.dataset.media;
      persistAndRender();
    });
  });

  [els.bulkLines, els.bulkStartDate, els.bulkTimes].forEach((input) => {
    input.addEventListener("input", updateBulkPreview);
    input.addEventListener("change", updateBulkPreview);
  });
}

function loadPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return seedPosts();
}

function seedPosts() {
  const week = startOfWeek(new Date());
  const day = (offset) => toInputDate(addDays(week, offset));

  return [
    {
      id: crypto.randomUUID(),
      title: "Summer camp launch teaser",
      captions: {
        instagram:
          "The first look at our summer camp lineup is here. Save this post, send it to your crew, and watch this space for the full drop.",
        facebook:
          "Our summer camp lineup is almost ready. We are sharing the first preview today with more details coming this week.",
      },
      date: day(1),
      time: "09:00",
      status: "Scheduled",
      format: "Photo",
      platforms: ["instagram", "facebook"],
      campaign: "Summer Launch",
      tags: "#summercamp #outdoorlife #community",
      media: "camp",
      checklist: { media: true, links: true, owner: false },
      analytics: { reach: 8200, likes: 612, comments: 46, saves: 92 },
    },
    {
      id: crypto.randomUUID(),
      title: "Packing list carousel",
      captions: {
        instagram:
          "A simple gear list for anyone joining the next trip. Slide 4 is the one people always forget.",
        facebook:
          "We put together a practical packing checklist for the next trip. Share it with anyone joining you.",
      },
      date: day(2),
      time: "13:30",
      status: "Review",
      format: "Carousel",
      platforms: ["instagram"],
      campaign: "Evergreen",
      tags: "#packinglist #campgear",
      media: "gear",
      checklist: { media: true, links: false, owner: false },
      analytics: { reach: 4100, likes: 284, comments: 18, saves: 135 },
    },
    {
      id: crypto.randomUUID(),
      title: "Parent community story",
      captions: {
        instagram:
          "One thing we keep hearing from families: the best camp memories start before the first activity begins.",
        facebook:
          "A note from the parent community about what makes camp feel welcoming from day one.",
      },
      date: day(4),
      time: "16:15",
      status: "Draft",
      format: "Link post",
      platforms: ["facebook"],
      campaign: "Community",
      tags: "#campparents #community",
      media: "team",
      checklist: { media: false, links: false, owner: false },
      analytics: { reach: 0, likes: 0, comments: 0, saves: 0 },
    },
    {
      id: crypto.randomUUID(),
      title: "Morning reel recap",
      captions: {
        instagram:
          "Quiet lake, early light, full hearts. This is the kind of morning that keeps people coming back.",
        facebook:
          "A calm morning recap from the lake. More moments from this week are coming soon.",
      },
      date: day(5),
      time: "08:45",
      status: "Published",
      format: "Reel",
      platforms: ["instagram", "facebook"],
      campaign: "Summer Launch",
      tags: "#campmorning #reel",
      media: "lake",
      checklist: { media: true, links: true, owner: true },
      analytics: { reach: 14320, likes: 1108, comments: 89, saves: 214 },
    },
  ];
}

function render() {
  renderChrome();
  renderCalendar();
  renderEditor();
  savePosts();
}

function renderChrome() {
  els.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  const scheduled = state.posts.filter((post) => post.status === "Scheduled").length;
  const review = state.posts.filter((post) => post.status === "Review").length;
  els.scheduledCount.textContent = scheduled;
  els.reviewCount.textContent = review;
}

function renderCalendar() {
  const visible = filteredPosts();
  els.weekGrid.classList.toggle("hidden", state.view !== "week");
  els.monthGrid.classList.toggle("hidden", state.view !== "month");

  if (state.view === "week") {
    renderWeek(visible);
  } else {
    renderMonth(visible);
  }
}

function renderWeek(posts) {
  const start = startOfWeek(state.rangeDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const end = days[6];

  els.calendarTitle.textContent = `${formatShortDate(start)} - ${formatShortDate(end)}`;
  els.weekGrid.innerHTML = "";

  days.forEach((day) => {
    const dayKey = toInputDate(day);
    const dayPosts = posts
      .filter((post) => post.date === dayKey)
      .sort((a, b) => a.time.localeCompare(b.time));

    const dayEl = document.createElement("article");
    dayEl.className = "calendar-day";
    dayEl.innerHTML = `
      <div class="day-header">
        <strong>${formatWeekday(day)}</strong>
        <span class="day-meta">${formatShortDate(day)}</span>
      </div>
      <div class="day-body"></div>
    `;

    const body = dayEl.querySelector(".day-body");
    if (!dayPosts.length) {
      body.innerHTML = `<button class="empty-day" type="button" data-empty-date="${dayKey}">+ Add post</button>`;
    } else {
      dayPosts.forEach((post) => body.appendChild(postCard(post)));
    }

    els.weekGrid.appendChild(dayEl);
  });

  els.weekGrid.querySelectorAll("[data-empty-date]").forEach((button) => {
    button.addEventListener("click", () => createPost(button.dataset.emptyDate));
  });
}

function renderMonth(posts) {
  const start = startOfMonth(state.rangeDate);
  const gridStart = startOfWeek(start);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  els.calendarTitle.textContent = formatMonth(start);
  els.monthGrid.innerHTML = "";

  days.forEach((day) => {
    const dayKey = toInputDate(day);
    const dayPosts = posts
      .filter((post) => post.date === dayKey)
      .sort((a, b) => a.time.localeCompare(b.time));

    const cell = document.createElement("article");
    cell.className = `month-cell${day.getMonth() === start.getMonth() ? "" : " muted"}`;
    cell.innerHTML = `
      <div class="month-date">
        <span>${day.getDate()}</span>
        <span>${dayPosts.length ? dayPosts.length : ""}</span>
      </div>
    `;

    dayPosts.slice(0, 3).forEach((post) => {
      const button = document.createElement("button");
      button.className = "mini-post";
      button.type = "button";
      button.textContent = `${formatTime(post.time)} ${post.title}`;
      button.addEventListener("click", () => selectPost(post.id));
      cell.appendChild(button);
    });

    if (dayPosts.length > 3) {
      const more = document.createElement("span");
      more.className = "day-meta";
      more.textContent = `+${dayPosts.length - 3} more`;
      cell.appendChild(more);
    }

    els.monthGrid.appendChild(cell);
  });
}

function postCard(post) {
  const card = document.createElement("button");
  card.className = `post-card${post.id === state.selectedId ? " selected" : ""}`;
  card.type = "button";
  card.style.borderLeftColor = post.platforms.includes("instagram") ? "var(--rose)" : "var(--blue)";
  card.innerHTML = `
    <span class="time">${formatTime(post.time)} · ${post.format}</span>
    <h3>${escapeHtml(post.title)}</h3>
    <p>${escapeHtml(post.captions.instagram || post.captions.facebook || "")}</p>
    <div class="card-footer">
      <div class="platform-pills">
        ${post.platforms
          .map((platform) => `<span class="platform-pill ${platform}">${platform === "instagram" ? "IG" : "FB"}</span>`)
          .join("")}
      </div>
      <span class="status-chip ${post.status.toLowerCase()}">${post.status}</span>
    </div>
  `;
  card.addEventListener("click", () => selectPost(post.id));
  return card;
}

function renderEditor() {
  const post = selectedPost();
  if (!post) return;

  els.editorHeading.textContent = post.title || "Untitled post";
  els.title.value = post.title;
  els.caption.value = post.captions[state.captionPlatform] || "";
  els.captionLabel.textContent = `${capitalize(state.captionPlatform)} caption`;
  els.date.value = post.date;
  els.time.value = post.time;
  els.status.value = post.status;
  els.format.value = post.format;
  els.platformInstagram.checked = post.platforms.includes("instagram");
  els.platformFacebook.checked = post.platforms.includes("facebook");
  els.campaign.value = post.campaign;
  els.tags.value = post.tags;
  els.checkMedia.checked = post.checklist.media;
  els.checkLinks.checked = post.checklist.links;
  els.checkOwner.checked = post.checklist.owner;

  els.captionTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.captionPlatform === state.captionPlatform);
  });

  els.previewPlatform.textContent = platformLabel(post.platforms);
  els.previewTitle.textContent = post.title || "Untitled post";
  els.previewCaption.textContent = post.captions[state.captionPlatform] || post.captions.instagram || "";
  els.previewMedia.className = `preview-media media-${post.media || "camp"}`;

  els.metricReach.textContent = formatNumber(post.analytics.reach);
  els.metricLikes.textContent = formatNumber(post.analytics.likes);
  els.metricComments.textContent = formatNumber(post.analytics.comments);
  els.metricSaves.textContent = formatNumber(post.analytics.saves);
}

function updateSelectedFromForm() {
  const post = selectedPost();
  if (!post) return;

  post.title = els.title.value;
  post.captions[state.captionPlatform] = els.caption.value;
  post.date = els.date.value;
  post.time = els.time.value;
  post.status = els.status.value;
  post.format = els.format.value;
  post.platforms = [
    ...(els.platformInstagram.checked ? ["instagram"] : []),
    ...(els.platformFacebook.checked ? ["facebook"] : []),
  ];
  if (!post.platforms.length) {
    post.platforms = ["instagram"];
    els.platformInstagram.checked = true;
  }
  post.campaign = els.campaign.value;
  post.tags = els.tags.value;
  post.checklist = {
    media: els.checkMedia.checked,
    links: els.checkLinks.checked,
    owner: els.checkOwner.checked,
  };

  persistAndRender();
}

function commitCaption() {
  const post = selectedPost();
  if (post) {
    post.captions[state.captionPlatform] = els.caption.value;
    savePosts();
  }
}

function createPost(date = toInputDate(new Date())) {
  commitCaption();
  const post = {
    id: crypto.randomUUID(),
    title: "Untitled post",
    captions: {
      instagram: "Write the Instagram version here.",
      facebook: "Write the Facebook version here.",
    },
    date,
    time: "10:00",
    status: "Draft",
    format: "Photo",
    platforms: ["instagram", "facebook"],
    campaign: "Summer Launch",
    tags: "",
    media: "camp",
    checklist: { media: false, links: false, owner: false },
    analytics: { reach: 0, likes: 0, comments: 0, saves: 0 },
  };
  state.posts.unshift(post);
  state.selectedId = post.id;
  state.captionPlatform = "instagram";
  persistAndRender();
}

function openBulkScheduler() {
  commitCaption();
  els.bulkStartDate.value = toInputDate(new Date());
  updateBulkPreview();
  if (typeof els.bulkDialog.showModal === "function") {
    els.bulkDialog.showModal();
  } else {
    els.bulkDialog.setAttribute("open", "");
  }
}

function closeBulkScheduler() {
  els.bulkDialog.close();
}

function updateBulkPreview() {
  const lines = parseBulkLines(els.bulkLines.value);
  const times = parseBulkTimes(els.bulkTimes.value);
  const start = els.bulkStartDate.value ? parseDate(els.bulkStartDate.value) : new Date();
  const end = lines.length ? addDays(start, Math.floor((lines.length - 1) / Math.max(times.length, 1))) : start;
  els.bulkPreviewCount.textContent = `${lines.length} ${lines.length === 1 ? "post" : "posts"} ready`;
  els.bulkPreviewRange.textContent = lines.length
    ? `${formatShortDate(start)} - ${formatShortDate(end)} using ${times.length || 1} time ${times.length === 1 ? "slot" : "slots"} per day.`
    : "Paste at least one title or title/caption line.";
}

function createBulkPosts() {
  const lines = parseBulkLines(els.bulkLines.value);
  const times = parseBulkTimes(els.bulkTimes.value);
  const platforms = [
    ...(els.bulkPlatformInstagram.checked ? ["instagram"] : []),
    ...(els.bulkPlatformFacebook.checked ? ["facebook"] : []),
  ];

  if (!lines.length || !platforms.length) {
    updateBulkPreview();
    return;
  }

  const start = els.bulkStartDate.value ? parseDate(els.bulkStartDate.value) : new Date();
  const posts = lines.map((line, index) => {
    const timeIndex = index % times.length;
    const dayOffset = Math.floor(index / times.length);
    const instagramCaption = line.instagramCaption || line.caption || "";
    const facebookCaption = line.facebookCaption || line.caption || instagramCaption;

    return {
      id: crypto.randomUUID(),
      title: line.title,
      captions: {
        instagram: instagramCaption,
        facebook: facebookCaption,
      },
      date: toInputDate(addDays(start, dayOffset)),
      time: times[timeIndex],
      status: els.bulkStatus.value,
      format: els.bulkFormat.value,
      platforms,
      campaign: els.bulkCampaign.value,
      tags: "",
      media: els.bulkMedia.value,
      checklist: { media: false, links: false, owner: false },
      analytics: { reach: 0, likes: 0, comments: 0, saves: 0 },
    };
  });

  state.posts = [...posts, ...state.posts];
  state.selectedId = posts[0].id;
  state.captionPlatform = "instagram";
  state.view = "week";
  state.rangeDate = startOfWeek(parseDate(posts[0].date));
  closeBulkScheduler();
  persistAndRender();
}

function parseBulkLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, caption = "", facebookCaption = ""] = line.split("|").map((part) => part.trim());
      return {
        title: title || "Untitled post",
        caption,
        instagramCaption: caption,
        facebookCaption,
      };
    });
}

function parseBulkTimes(value) {
  const times = value
    .split(",")
    .map((time) => time.trim())
    .filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time));
  return times.length ? times : ["09:00"];
}

function duplicateSelectedPost() {
  const post = selectedPost();
  if (!post) return;
  commitCaption();

  const copy = JSON.parse(JSON.stringify(post));
  copy.id = crypto.randomUUID();
  copy.title = `${post.title} copy`;
  copy.status = "Draft";
  copy.date = toInputDate(addDays(parseDate(post.date), 1));
  copy.analytics = { reach: 0, likes: 0, comments: 0, saves: 0 };
  state.posts.unshift(copy);
  state.selectedId = copy.id;
  persistAndRender();
}

function deleteSelectedPost() {
  if (state.posts.length <= 1) return;
  const index = state.posts.findIndex((post) => post.id === state.selectedId);
  state.posts = state.posts.filter((post) => post.id !== state.selectedId);
  state.selectedId = state.posts[Math.max(0, index - 1)]?.id ?? state.posts[0]?.id ?? null;
  persistAndRender();
}

function selectPost(id) {
  commitCaption();
  state.selectedId = id;
  renderCalendar();
  renderEditor();
}

function persistAndRender() {
  renderChrome();
  renderCalendar();
  renderEditor();
  savePosts();
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
}

function filteredPosts() {
  return state.posts.filter((post) => {
    const accountMatch = post.platforms.some((platform) => state.filters.accounts.has(platform));
    const statusMatch = state.filters.statuses.has(post.status);
    const campaignMatch = state.filters.campaign === "all" || post.campaign === state.filters.campaign;
    const haystack = `${post.title} ${post.captions.instagram} ${post.captions.facebook} ${post.campaign} ${post.tags}`.toLowerCase();
    const searchMatch = !state.filters.search || haystack.includes(state.filters.search);
    return accountMatch && statusMatch && campaignMatch && searchMatch;
  });
}

function selectedPost() {
  return state.posts.find((post) => post.id === state.selectedId) ?? state.posts[0];
}

function moveRange(direction) {
  if (state.view === "month") {
    state.rangeDate = addMonths(state.rangeDate, direction);
  } else {
    state.rangeDate = addDays(state.rangeDate, direction * 7);
  }
  render();
}

function exportCsv() {
  const header = ["Title", "Date", "Time", "Status", "Format", "Platforms", "Campaign"];
  const rows = state.posts.map((post) => [
    post.title,
    post.date,
    post.time,
    post.status,
    post.format,
    post.platforms.join(" + "),
    post.campaign,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nashley-social-scheduler-posts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function toggleSetValue(set, value, isEnabled) {
  if (isEnabled) {
    set.add(value);
  } else {
    set.delete(value);
  }
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

function startOfMonth(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(1);
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date, amount) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value);
}

function platformLabel(platforms) {
  if (platforms.length === 2) return "Instagram and Facebook";
  if (platforms.includes("instagram")) return "Instagram";
  return "Facebook";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
