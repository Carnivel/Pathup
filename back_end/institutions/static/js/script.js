let colleges = [];
const API_ENDPOINTS = [
  "../../back_end/courses.php?api=1",
  "/Pathup/back_end/courses.php?api=1",
  "../../pathup_api/courses.php",
  "/Pathup/pathup_api/courses.php",
  "home_data.json"
];

const state = {
  visibleCount: 6,
  compare: [...new Set(JSON.parse(localStorage.getItem("pathup-compare") || "[]"))].slice(0, 3),
  saved: new Set(JSON.parse(localStorage.getItem("pathup-saved") || "[]")),
  recent: JSON.parse(localStorage.getItem("pathup-recent") || "[]")
};

const elements = {
  header: document.querySelector(".site-header"),
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
  toast: document.getElementById("toast")
};

let filteredColleges = [];
let finderParamsApplied = false;

const formatFeeRange = (value) => {
  const format = new Intl.NumberFormat("en-IN");
  return `Up to INR ${format.format(value)}`;
};

const parseUniversityFromDescription = (description) => {
  if (!description || typeof description !== "string") {
    return "";
  }
  const separatorIndex = description.indexOf(" - ");
  return separatorIndex === -1 ? "" : description.slice(separatorIndex + 3).trim();
};

const normalizeCollege = (raw, index) => {
  const id = raw.id ?? raw.college_id ?? `${raw.college_name || raw.title || "college"}-${index + 1}`;

  return {
    id: String(id),
    college_name: raw.college_name || raw.title || "Unknown College",
    course: raw.course || raw.course_name || "Unknown Course",
    university:
      raw.university ||
      raw.affiliated_university ||
      parseUniversityFromDescription(raw.description) ||
      "Not specified",
    approval: raw.approval || "Not specified",
    specialisation:
      raw.specialisation ||
      raw.specialization ||
      raw.specializations ||
      raw.badge ||
      "General",
    location: raw.location || raw.city || "Karnataka",
    fees: Number(raw.fees || raw.fees_max || raw.fees_min || 0),
    ownership: raw.ownership || raw.type || "",
    exam: raw.exam || raw.exam_required || "",
    rating: Number(raw.rating || 0)
  };
};

const getApiRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.courses)) {
    return payload.courses;
  }
  return [];
};

const uniqueValues = (values) => {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
};

const setSelectOptions = (selectElement, values, defaultLabel) => {
  if (!selectElement) {
    return;
  }

  const previousValue = selectElement.value;
  selectElement.innerHTML = "";
  selectElement.add(new Option(defaultLabel, ""));
  values.forEach((value) => selectElement.add(new Option(value, value)));
  selectElement.value = values.includes(previousValue) ? previousValue : "";
};

const applyFinderParamsFromQuery = () => {
  if (finderParamsApplied || !elements.searchInput) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  const course = params.get("course");
  const location = params.get("location");

  if (search) {
    elements.searchInput.value = search;
  }

  if (course && elements.filterCourse) {
    elements.filterCourse.value = course;
  }

  if (location && elements.filterLocation) {
    elements.filterLocation.value = location;
  }

  finderParamsApplied = true;
};

const populateFilterOptions = () => {
  const courses = uniqueValues(colleges.map((college) => college.course));
  const specializations = uniqueValues(colleges.map((college) => college.specialisation));
  const locations = uniqueValues(colleges.map((college) => college.location));
  const exams = uniqueValues(colleges.map((college) => college.exam));

  setSelectOptions(elements.heroCourse, courses, "All Streams");
  setSelectOptions(elements.filterCourse, courses, "All Courses");
  setSelectOptions(elements.filterSpecialization, specializations, "All Specializations");
  setSelectOptions(elements.heroLocation, locations, "All Karnataka");
  setSelectOptions(elements.filterLocation, locations, "All Karnataka");
  setSelectOptions(elements.filterExam, exams, "Any Exam");

  applyFinderParamsFromQuery();
};

const loadCollegeData = async () => {
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const rows = getApiRows(payload);
      if (!rows.length) {
        continue;
      }

      colleges = rows.map(normalizeCollege);
      filteredColleges = [...colleges];
      populateFilterOptions();
      return;
    } catch (error) {
      console.error(`Failed to load ${endpoint}`, error);
    }
  }

  colleges = [];
  filteredColleges = [];

  if (elements.collegeGrid) {
    elements.collegeGrid.innerHTML = "<p>Unable to load college data from backend.</p>";
  }
  if (elements.resultsCount) {
    elements.resultsCount.textContent = "0 colleges found";
  }
  if (elements.compareEmpty && state.compare.length) {
    elements.compareEmpty.textContent = "Unable to load college data from backend.";
  }
};

const showToast = (message) => {
  if (!elements.toast) {
    return;
  }
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2000);
};

const updateLocalStorage = () => {
  localStorage.setItem("pathup-saved", JSON.stringify([...state.saved]));
  localStorage.setItem("pathup-recent", JSON.stringify(state.recent));
  localStorage.setItem("pathup-compare", JSON.stringify(state.compare));
};

const getOwnershipFilters = () => {
  return Array.from(document.querySelectorAll("input[name='ownership']:checked"))
    .map((input) => input.value);
};

const applyFilters = (resetCount = true) => {
  if (
    !elements.searchInput ||
    !elements.filterCourse ||
    !elements.filterSpecialization ||
    !elements.filterLocation ||
    !elements.feeRange ||
    !elements.filterExam ||
    !elements.filterRating
  ) {
    return;
  }

  if (resetCount) {
    state.visibleCount = 6;
  }

  const query = elements.searchInput.value.trim().toLowerCase();
  const course = elements.filterCourse.value;
  const specialization = elements.filterSpecialization.value;
  const location = elements.filterLocation.value;
  const feeCap = Number(elements.feeRange.value);
  const ownership = getOwnershipFilters().map((value) => value.toLowerCase());
  const exam = elements.filterExam.value;
  const rating = Number(elements.filterRating.value || 0);

  filteredColleges = colleges.filter((college) => {
    const matchesQuery = !query || [
      college.college_name,
      college.specialisation,
      college.course,
      college.university,
      college.exam,
      college.ownership
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesCourse = !course || college.course === course;
    const matchesSpec = !specialization || college.specialisation === specialization;
    const matchesLocation = !location || college.location === location;
    const fee = Number(college.fees || 0);
    const matchesFee = fee === 0 || fee <= feeCap;
    const ownershipValue = String(college.ownership || "").toLowerCase();
    const matchesOwnership = ownership.length === 0 || ownership.some((item) => ownershipValue.includes(item));
    const examValue = String(college.exam || "").toLowerCase();
    const matchesExam = !exam || examValue.includes(exam.toLowerCase());
    const matchesRating = rating === 0 || Number(college.rating || 0) >= rating;

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
  if (!elements.collegeGrid) {
    return;
  }

  const compareSet = new Set(state.compare);
  const visible = filteredColleges.slice(0, state.visibleCount);
  elements.collegeGrid.innerHTML = visible
    .map((college) => {
      const isSaved = state.saved.has(college.id);
      const isCompared = compareSet.has(college.id);
      const feeLabel = college.fees
        ? `INR ${new Intl.NumberFormat("en-IN").format(college.fees)}`
        : "Not available";
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
            <span>Fees: ${feeLabel}</span>
            <span>Exam: ${college.exam || "Not specified"}</span>
          </div>
          <div class="card-meta">
            <span>Ownership: ${college.ownership || "Not specified"}</span>
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

  if (elements.resultsCount) {
    elements.resultsCount.textContent = `${filteredColleges.length} colleges found`;
  }
  if (elements.loadMore) {
    elements.loadMore.style.display = filteredColleges.length > state.visibleCount ? "inline-flex" : "none";
  }
  renderCompareTable();
  renderSavedList();
  renderRecentList();
};

const renderSavedList = () => {
  if (!elements.savedList) {
    return;
  }
  const saved = colleges.filter((college) => state.saved.has(college.id));
  elements.savedList.innerHTML = saved.length
    ? saved.map((college) => `<li>${college.college_name}</li>`).join("")
    : "<li>No saved colleges yet</li>";
};

const renderRecentList = () => {
  if (!elements.recentList) {
    return;
  }
  const recent = state.recent
    .map((id) => colleges.find((college) => college.id === id))
    .filter(Boolean);
  elements.recentList.innerHTML = recent.length
    ? recent.map((college) => `<li>${college.college_name}</li>`).join("")
    : "<li>No recent views</li>";
};

const renderCompareTable = () => {
  if (!elements.compareTable || !elements.compareEmpty) {
    return;
  }

  if (state.compare.length === 0) {
    elements.compareTable.innerHTML = "";
    elements.compareEmpty.style.display = "block";
    return;
  }

  const selected = state.compare
    .map((id) => colleges.find((college) => college.id === id))
    .filter(Boolean);

  if (selected.length === 0) {
    elements.compareTable.innerHTML = "";
    elements.compareEmpty.style.display = "block";
    return;
  }

  elements.compareEmpty.style.display = "none";

  const rows = [
    { label: "Location", values: selected.map((c) => c.location || "Karnataka") },
    { label: "Course", values: selected.map((c) => c.course) },
    { label: "Specialisation", values: selected.map((c) => c.specialisation || "General") },
    {
      label: "Fees (per year)",
      values: selected.map((c) => (c.fees ? `INR ${new Intl.NumberFormat("en-IN").format(c.fees)}` : "Not available"))
    },
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
  if (!elements.feeRange || !elements.feeValue) {
    return;
  }
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
  renderCompareTable();
};

const bindCommonEvents = () => {
  if (!elements.header) {
    return;
  }
  window.addEventListener("scroll", () => {
    elements.header.classList.toggle("scrolled", window.scrollY > 10);
  });
};

const bindFinderEvents = () => {
  if (!elements.collegeGrid) {
    return;
  }

  [
    elements.searchInput,
    elements.filterCourse,
    elements.filterSpecialization,
    elements.filterLocation,
    elements.filterExam,
    elements.filterRating
  ].forEach((input) => {
    if (input) {
      input.addEventListener("input", () => applyFilters());
    }
  });

  document.querySelectorAll("input[name='ownership']").forEach((input) => {
    input.addEventListener("change", () => applyFilters());
  });

  if (elements.feeRange) {
    elements.feeRange.addEventListener("input", () => {
      setFeeLabel();
      applyFilters(false);
    });
  }

  if (elements.loadMore) {
    elements.loadMore.addEventListener("click", () => {
      state.visibleCount += 4;
      renderCollegeCards();
    });
  }

  if (elements.resetFilters) {
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
  }

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
  bindCommonEvents();
  bindFinderEvents();

  loadCollegeData().then(() => {
    if (elements.collegeGrid) {
      applyFilters();
    } else {
      renderCompareTable();
    }
  });
};

init();
