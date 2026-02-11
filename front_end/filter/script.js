const API_URL = 'http://localhost/Pathup/back_end/courses.php';

const cardsContainer = document.querySelector('.cards');
let cards = Array.from(document.querySelectorAll('.card'));
const filters = Array.from(document.querySelectorAll('.filter-input'));
const resultsCount = document.getElementById('results-count');
const courseSearch = document.getElementById('course-search');
const resetButton = document.getElementById('reset-filters');
const selectedFiltersEl = document.getElementById('selected-filters');
const bcaSpecializationSection = document.getElementById('bca-specialization');
const statusMessage = document.getElementById('status-message');
const viewToggle = document.querySelector('.results-header .toggle');
const viewButtons = viewToggle ? Array.from(viewToggle.querySelectorAll('button[data-view]')) : [];
const compareBar = document.getElementById('compare-bar');
const compareCount = document.getElementById('compare-count');
const compareGo = document.getElementById('compare-go');
const compareClear = document.getElementById('compare-clear');
const selectedCompareIds = new Set();

const normalize = (value) => String(value || '').trim().toLowerCase();
const splitTokens = (value) =>
  normalize(value).split(',').map((item) => item.trim()).filter(Boolean);

const getCheckedValues = (filterName) =>
  filters
    .filter((el) => el.dataset.filter === filterName && el.checked)
    .map((el) => normalize(el.value));

const matchesAny = (cardValues, selectedValues) => {
  if (!selectedValues.length) return true;
  return selectedValues.some((value) => cardValues.includes(value));
};

const renderSelectedFilters = () => {
  if (!selectedFiltersEl) return;
  const chips = [];

  filters.forEach((el) => {
    const labelText = el.closest('label')?.textContent?.trim() || '';
    if (el.type === 'checkbox' && el.checked && !el.defaultChecked) {
      chips.push({ key: el.dataset.filter, value: el.value, label: labelText });
    }
    if (el.type === 'radio' && el.checked && !el.defaultChecked) {
      chips.push({ key: el.dataset.filter, value: el.value, label: labelText });
    }
    if (el.tagName === 'SELECT' && el.selectedIndex > 0) {
      chips.push({
        key: el.dataset.filter,
        value: el.value,
        label: `${el.dataset.filter}: ${el.value}`
      });
    }
    if (el.type === 'range' && String(el.value) !== String(el.defaultValue)) {
      chips.push({
        key: el.dataset.filter,
        value: el.value,
        label: `${el.dataset.filter}: ${el.value}`
      });
    }
    if (el.type === 'text' && el.value.trim()) {
      chips.push({ key: 'search', value: el.value.trim(), label: `Search: ${el.value.trim()}` });
    }
  });

  if (!chips.length) {
    selectedFiltersEl.innerHTML = '';
    return;
  }

  selectedFiltersEl.innerHTML = chips
    .map(
      (chip) =>
        `<span class="filter-chip" data-key="${chip.key}" data-value="${chip.value}">${chip.label}<button type="button" aria-label="Remove filter">x</button></span>`
    )
    .join('');
};

const resetFilterChip = (key, value) => {
  if (key === 'search') {
    if (courseSearch) courseSearch.value = '';
    return;
  }

  const targets = filters.filter((el) => el.dataset.filter === key);
  targets.forEach((el) => {
    if (el.type === 'checkbox') {
      if (el.value === value) el.checked = false;
    } else if (el.type === 'radio') {
      if (el.value === value) {
        const defaultRadio = targets.find((item) => item.defaultChecked);
        if (defaultRadio) defaultRadio.checked = true;
      }
    } else if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (el.type === 'range') {
      el.value = el.defaultValue;
    }
  });
};

const applyFilters = () => {
  const courseValues = getCheckedValues('course');
  const levelValues = getCheckedValues('level');
  const examValues = getCheckedValues('exam');
  const typeValues = getCheckedValues('type');
  const specializationValues = getCheckedValues('specialization');
  const ratingValues = getCheckedValues('rating').map(Number);
  const placementValues = getCheckedValues('placement').map(Number);
  const facilityValues = getCheckedValues('facility');
  const modeValue = normalize(
    document.querySelector('input[data-filter="mode"]:checked')?.value
  );
  const locationValue = normalize(
    document.querySelector('select[data-filter="location"]')?.value
  );
  const feesMax = Number(
    document.querySelector('input[data-filter="fees"]')?.value || 0
  );
  const seatsMin = Number(
    document.querySelector('input[data-filter="seats"]')?.value || 0
  );
  const searchTerm = normalize(courseSearch?.value);

  let visibleCount = 0;

  cards.forEach((card) => {
    const data = card.dataset;
    const courseTokens = splitTokens(data.course);
    const levelTokens = splitTokens(data.level);
    const examTokens = splitTokens(data.exam);
    const typeTokens = splitTokens(data.type);
    const specializationTokens = splitTokens(data.specializations);
    const facilityTokens = splitTokens(data.facilities);

    let matches = true;

    if (courseValues.length) {
      matches = matches && matchesAny(courseTokens, courseValues);
    }

    if (searchTerm) {
      const title = normalize(card.querySelector('h3')?.textContent);
      const courseMatch =
        courseTokens.some((token) => token.includes(searchTerm)) ||
        title.includes(searchTerm);
      matches = matches && courseMatch;
    }

    if (levelValues.length) {
      matches = matches && matchesAny(levelTokens, levelValues);
    }

    if (modeValue) {
      matches = matches && normalize(data.mode) === modeValue;
    }

    if (examValues.length) {
      matches = matches && matchesAny(examTokens, examValues);
    }

    if (locationValue && locationValue !== 'all india') {
      matches = matches && normalize(data.location) === locationValue;
    }

    if (typeValues.length) {
      matches = matches && matchesAny(typeTokens, typeValues);
    }

    if (specializationValues.length) {
      matches = matches && matchesAny(specializationTokens, specializationValues);
    }

    if (ratingValues.length) {
      const rating = Number(data.rating || 0);
      matches = matches && ratingValues.some((value) => rating >= value);
    }

    if (feesMax) {
      const fees = Number(data.fees || 0);
      matches = matches && fees <= feesMax;
    }

    if (seatsMin) {
      const seats = Number(data.seats || 0);
      matches = matches && seats >= seatsMin;
    }

    if (placementValues.length) {
      const placement = Number(data.placement || 0);
      matches = matches && placementValues.some((value) => placement >= value);
    }

    if (facilityValues.length) {
      matches = matches && matchesAny(facilityTokens, facilityValues);
    }

    card.style.display = matches ? '' : 'none';
    if (matches) visibleCount += 1;
  });

  if (resultsCount) {
    resultsCount.textContent = `Showing ${visibleCount} of ${cards.length} results`;
  }

  if (bcaSpecializationSection) {
    const hasBcaSelected = courseValues.includes('bca');
    bcaSpecializationSection.classList.toggle('is-hidden', !hasBcaSelected);
    if (!hasBcaSelected) {
      filters
        .filter((el) => el.dataset.filter === 'specialization')
        .forEach((el) => {
          el.checked = false;
        });
    }
  }

  renderSelectedFilters();
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const renderCards = (courses) => {
  if (!cardsContainer || !Array.isArray(courses)) return;
  cardsContainer.innerHTML = courses
    .map((course) => {
      const facilities = toArray(course.facilities).join(',');
      return `
        <article class="card"
          data-id="${course.id || ''}"
          data-course="${course.course || ''}"
          data-level="${course.level || ''}"
          data-mode="${course.mode || ''}"
          data-exam="${course.exam || ''}"
          data-location="${course.location || ''}"
          data-type="${course.type || ''}"
          data-rating="${course.rating || 0}"
          data-fees="${course.fees || 0}"
          data-seats="${course.seats || 0}"
          data-placement="${course.placement || 0}"
          data-specializations="${course.specializations || ''}"
          data-facilities="${facilities}">
          <div>
            <h3>${course.title || 'Course Title'}</h3>
            <p>${course.description || ''}</p>
            <div class="meta">
              <span class="badge">${course.badge || course.course || ''}</span>
              <span>${course.location || ''}</span>
              <span>Fees: INR ${course.fees || 0} / year</span>
              <span>Placement: ${course.placement || 0} LPA avg</span>
              <span>Rating: ${course.rating || 0}</span>
            </div>
            <div class="cta">
              <button class="compare-btn" data-id="${course.id || ''}">Compare</button>
              <button class="primary">Apply Now</button>
            </div>
          </div>
          <div class="score">
            <strong>${course.score || ''}</strong>
            <span>Match Score</span>
          </div>
        </article>
      `;
    })
    .join('');

  cards = Array.from(document.querySelectorAll('.card'));
  applyFilters();
  syncCompareButtons();
  updateCompareBar();
};

const loadCourses = async () => {
  if (!API_URL) {
    if (statusMessage) {
      statusMessage.textContent = 'Add API URL in script.js to load courses.';
    }
    return;
  }
  try {
    if (statusMessage) {
      statusMessage.textContent = 'Loading courses...';
    }
    const response = await fetch(API_URL);
    if (!response.ok) {
      if (statusMessage) {
        statusMessage.textContent = 'Failed to load courses.';
      }
      return;
    }
    const data = await response.json();
    renderCards(Array.isArray(data) ? data : data.courses);
    if (statusMessage) {
      statusMessage.textContent = '';
    }
  } catch (error) {
    console.error('Failed to load courses:', error);
    if (statusMessage) {
      statusMessage.textContent = 'Error loading courses.';
    }
  }
};

const updateCompareBar = () => {
  if (!compareBar || !compareCount || !compareGo) return;
  const count = selectedCompareIds.size;
  compareCount.textContent = `${count} selected`;
  compareGo.disabled = count < 2;
  compareBar.classList.toggle('is-visible', count > 0);
};

const syncCompareButtons = () => {
  if (!cardsContainer) return;
  cardsContainer.querySelectorAll('.compare-btn').forEach((btn) => {
    const id = btn.dataset.id;
    btn.classList.toggle('is-active', selectedCompareIds.has(id));
    btn.textContent = selectedCompareIds.has(id) ? 'Selected' : 'Compare';
  });
};

filters.forEach((el) => {
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
});

if (resetButton) {
  resetButton.addEventListener('click', () => {
    filters.forEach((el) => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = el.defaultChecked;
      } else if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = el.defaultValue;
      }
    });
    applyFilters();
  });
}

if (selectedFiltersEl) {
  selectedFiltersEl.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const chip = button.closest('.filter-chip');
    if (!chip) return;
    resetFilterChip(chip.dataset.key, chip.dataset.value);
    applyFilters();
  });
}

applyFilters();
loadCourses();

if (viewButtons.length && cardsContainer) {
  viewToggle.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (!button) return;
    const view = button.dataset.view;
    viewButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    cardsContainer.classList.toggle('is-compact', view === 'compact');
  });
}

if (cardsContainer) {
  cardsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.compare-btn');
    if (!button) return;
    const id = button.dataset.id;
    if (!id) return;
    if (selectedCompareIds.has(id)) {
      selectedCompareIds.delete(id);
    } else {
      selectedCompareIds.add(id);
    }
    syncCompareButtons();
    updateCompareBar();
  });
}

if (compareClear) {
  compareClear.addEventListener('click', () => {
    selectedCompareIds.clear();
    syncCompareButtons();
    updateCompareBar();
  });
}

if (compareGo) {
  compareGo.addEventListener('click', () => {
    const ids = Array.from(selectedCompareIds).join(',');
    if (!ids) return;
    window.location.href = `compare.html?ids=${encodeURIComponent(ids)}`;
  });
}

