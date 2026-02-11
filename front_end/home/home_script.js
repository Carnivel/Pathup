let colleges = [];

const state = {
  visibleCount: 6,
  compare: [],
  saved: new Set(JSON.parse(localStorage.getItem("pathup-saved") || "[]")),
  recent: JSON.parse(localStorage.getItem("pathup-recent") || "[]")
};

const elements = {
  header: document.querySelector(".site-header"),
  heroSearch: document.getElementById("heroSearch"),
  heroQuery: document.getElementById("heroQuery"),
  heroCourse: document.getElementById("heroCourse"),
  heroLocation: document.getElementById("heroLocation"),
  searchInput: document.getElementById("searchInput"),
  filterCourse: document.getElementById("filterCourse"),
  filterSpecialization: document.getElementById("filterSpecialization"),
  filterLocation: document.getElementById("filterLocation"),
  feeRange: document.getElementById("feeRange"),
  feeValue: document.getElementById("feeValue"),
  filterExam: document.getElementById("filterExam"),
  filterRating: document.getElementById("filterRating"),
  collegeGrid: document.getElementById("collegeGrid"),
  resultsCount: document.getElementById("resultsCount"),
  loadMore: document.getElementById("loadMore"),
  resetFilters: document.getElementById("resetFilters"),
  savedList: document.getElementById("savedList"),
  recentList: document.getElementById("recentList"),
  compareTable: document.getElementById("compareTable"),
  compareEmpty: document.getElementById("compareEmpty"),
  pageIndicator: document.getElementById("pageIndicator"),
  toast: document.getElementById("toast")
};

let filteredColleges = [...colleges];

const routes = {
  home: "Home",
  finder: "College Finder",
  career: "Career Guidance",
  compare: "Compare",
  tools: "Student Tools"
};

const getRouteFromHash = () => {
  const raw = window.location.hash.replace("#/", "").replace("#", "");
  return routes[raw] ? raw : "home";
};

const applyRoute = (route, { scroll = true } = {}) => {
  const safeRoute = routes[route] ? route : "home";
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === safeRoute);
  });
  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("data-route") === safeRoute);
  });
  if (elements.pageIndicator) {
    elements.pageIndicator.textContent = routes[safeRoute];
  }
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const navigateTo = (route, { scroll = true } = {}) => {
  const safeRoute = routes[route] ? route : "home";
  applyRoute(safeRoute, { scroll });
  const targetHash = `#/${safeRoute}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = `/${safeRoute}`;
  }
};

const jumpToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
};

const formatFeeRange = (value) => {
  const format = new Intl.NumberFormat("en-IN");
  return `Up to INR ${format.format(value)}`;
};

const loadCollegeData = async () => {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load data.json");
    }
    const data = await response.json();
    colleges = Array.isArray(data) ? data : [];
    filteredColleges = [...colleges];
  } catch (error) {
    colleges = [];
    filteredColleges = [];
    elements.collegeGrid.innerHTML = "<p>Unable to load college data.</p>";
  }
};

const showToast = (message) => {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2000);
};

const updateLocalStorage = () => {
  localStorage.setItem("pathup-saved", JSON.stringify([...state.saved]));
  localStorage.setItem("pathup-recent", JSON.stringify(state.recent));
};

const getOwnershipFilters = () => {
  return Array.from(document.querySelectorAll("input[name='ownership']:checked"))
    .map((input) => input.value);
};

const applyFilters = (resetCount = true) => {
  if (resetCount) {
    state.visibleCount = 6;
  }

  const query = elements.searchInput.value.trim().toLowerCase();
  const course = elements.filterCourse.value;
  const specialization = elements.filterSpecialization.value;
  const location = elements.filterLocation.value;
  const feeCap = Number(elements.feeRange.value);
  const ownership = getOwnershipFilters();
  const exam = elements.filterExam.value;
  const rating = Number(elements.filterRating.value || 0);

  filteredColleges = colleges.filter((college) => {
    const matchesQuery = !query || [college.college_name, college.specialisation, college.course, college.university]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesCourse = !course || college.course === course;
    const matchesSpec = !specialization || college.specialisation === specialization;
    const matchesLocation = !location || college.location === location;
    const matchesFee = !feeCap || true;
    const matchesOwnership = ownership.length === 0 || true;
    const matchesExam = !exam || true;
    const matchesRating = rating === 0 || true;

    return (
      matchesQuery &&
      matchesCourse &&
      matchesSpec &&
      matchesLocation &&
      matchesFee &&
      matchesOwnership &&
      matchesExam &&
      matchesRating
    );
  });

  renderCollegeCards();
};

const renderCollegeCards = () => {
  const visible = filteredColleges.slice(0, state.visibleCount);
  elements.collegeGrid.innerHTML = visible
    .map((college) => {
      const isSaved = state.saved.has(college.id);
      const isCompared = state.compare.includes(college.id);
      return `
        <article class="college-card">
          <div class="card-top">
            <div>
              <h3>${college.college_name}</h3>
              <div class="card-meta">
                <span>${college.location || "Karnataka"}</span>
                <span>${college.university}</span>
              </div>
            </div>
            <span class="badge">${college.approval}</span>
          </div>
          <div class="chip-group">
            <span class="chip">${college.course}</span>
            <span class="chip">${college.specialisation || "General"}</span>
          </div>
          <div class="card-meta">
            <span>University: ${college.university}</span>
            <span>Approval: ${college.approval}</span>
          </div>
          <div class="card-meta">
            <span>Course: ${college.course}</span>
          </div>
          <div class="card-actions">
            <button class="icon-btn ${isCompared ? "active" : ""}" data-action="compare" data-id="${college.id}" aria-pressed="${isCompared}">
              ${isCompared ? "Compared" : "Compare"}
            </button>
            <button class="icon-btn ${isSaved ? "active" : ""}" data-action="save" data-id="${college.id}" aria-pressed="${isSaved}">
              ${isSaved ? "Saved" : "Save"}
            </button>
            <button class="icon-btn" data-action="view" data-id="${college.id}">View Details</button>
            <button class="icon-btn" data-action="brochure" data-id="${college.id}">Download Brochure</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.resultsCount.textContent = `${filteredColleges.length} colleges found`;
  elements.loadMore.style.display = filteredColleges.length > state.visibleCount ? "inline-flex" : "none";
  renderCompareTable();
  renderSavedList();
  renderRecentList();
};

const renderSavedList = () => {
  const saved = colleges.filter((college) => state.saved.has(college.id));
  elements.savedList.innerHTML = saved.length
    ? saved.map((college) => `<li>${college.college_name}</li>`).join("")
    : "<li>No saved colleges yet</li>";
};

const renderRecentList = () => {
  const recent = state.recent
    .map((id) => colleges.find((college) => college.id === id))
    .filter(Boolean);
  elements.recentList.innerHTML = recent.length
    ? recent.map((college) => `<li>${college.college_name}</li>`).join("")
    : "<li>No recent views</li>";
};

const renderCompareTable = () => {
  if (state.compare.length === 0) {
    elements.compareTable.innerHTML = "";
    elements.compareEmpty.style.display = "block";
    return;
  }

  elements.compareEmpty.style.display = "none";
  const selected = state.compare.map((id) => colleges.find((college) => college.id === id)).filter(Boolean);

  const rows = [
    { label: "Location", values: selected.map((c) => c.location || "Karnataka") },
    { label: "Course", values: selected.map((c) => c.course) },
    { label: "Specialisation", values: selected.map((c) => c.specialisation || "General") },
    { label: "University", values: selected.map((c) => c.university) },
    { label: "Approval", values: selected.map((c) => c.approval) }
  ];

  const headerRow = `
    <thead>
      <tr>
        <th>Criteria</th>
        ${selected.map((college) => `<th>${college.college_name}</th>`).join("")}
      </tr>
    </thead>
  `;

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.label}</td>
          ${row.values.map((value) => `<td>${value}</td>`).join("")}
        </tr>
      `
    )
    .join("");

  elements.compareTable.innerHTML = headerRow + `<tbody>${bodyRows}</tbody>`;
};

const setFeeLabel = () => {
  elements.feeValue.textContent = formatFeeRange(elements.feeRange.value);
};

const handleCardAction = (action, id) => {
  const college = colleges.find((item) => item.id === id);
  if (!college) return;

  if (action === "save") {
    if (state.saved.has(id)) {
      state.saved.delete(id);
      showToast("Removed from saved colleges");
    } else {
      state.saved.add(id);
      showToast("Saved to your shortlist");
    }
  }

  if (action === "compare") {
    if (state.compare.includes(id)) {
      state.compare = state.compare.filter((item) => item !== id);
      showToast("Removed from compare");
    } else if (state.compare.length < 3) {
      state.compare.push(id);
      showToast("Added to compare");
    } else {
      showToast("You can compare up to 3 colleges");
    }
  }

  if (action === "view") {
    state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 5);
    showToast(`Viewing ${college.college_name}`);
  }

  if (action === "brochure") {
    showToast(`Brochure requested for ${college.college_name}`);
  }

  updateLocalStorage();
  renderCollegeCards();
};

const bindEvents = () => {
  window.addEventListener("scroll", () => {
    elements.header.classList.toggle("scrolled", window.scrollY > 10);
  });

  document.addEventListener("click", (event) => {
    const routeLink = event.target.closest("[data-route]");
    if (!routeLink) return;
    const route = routeLink.getAttribute("data-route");
    if (!route) return;
    if (routeLink.tagName === "A") {
      event.preventDefault();
    }
    navigateTo(route);
  });

  elements.heroSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.searchInput.value = elements.heroQuery.value;
    elements.filterCourse.value = elements.heroCourse.value;
    elements.filterLocation.value = elements.heroLocation.value;
    applyFilters();
    navigateTo("finder", { scroll: false });
    jumpToSection("finder");
  });

  document.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const stream = tile.getAttribute("data-stream");
      elements.filterCourse.value = stream;
      applyFilters();
      navigateTo("finder", { scroll: false });
      jumpToSection("finder");
    });
  });

  [
    elements.searchInput,
    elements.filterCourse,
    elements.filterSpecialization,
    elements.filterLocation,
    elements.filterExam,
    elements.filterRating
  ].forEach((input) => input.addEventListener("input", () => applyFilters()));

  document.querySelectorAll("input[name='ownership']").forEach((input) => {
    input.addEventListener("change", () => applyFilters());
  });

  elements.feeRange.addEventListener("input", () => {
    setFeeLabel();
    applyFilters(false);
  });

  elements.loadMore.addEventListener("click", () => {
    state.visibleCount += 4;
    renderCollegeCards();
  });

  elements.resetFilters.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.filterCourse.value = "";
    elements.filterSpecialization.value = "";
    elements.filterLocation.value = "";
    elements.filterExam.value = "";
    elements.filterRating.value = "";
    elements.feeRange.value = 600000;
    document.querySelectorAll("input[name='ownership']").forEach((input) => (input.checked = false));
    setFeeLabel();
    applyFilters();
  });

  elements.collegeGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.getAttribute("data-action");
    const id = button.getAttribute("data-id");
    handleCardAction(action, id);
  });
};

const init = () => {
  setFeeLabel();
  bindEvents();
  loadCollegeData().then(() => {
    renderCollegeCards();
    applyRoute(getRouteFromHash(), { scroll: false });
  });
  window.addEventListener("hashchange", () => applyRoute(getRouteFromHash(), { scroll: false }));
};

init();
