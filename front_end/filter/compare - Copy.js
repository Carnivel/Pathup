const API_URL = 'http://localhost/Pathup/back_end/courses.php';

const statusEl = document.getElementById('compare-status');
const tableWrapper = document.getElementById('compare-table-wrapper');

const getIdsFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const ids = params.get('ids');
  if (!ids) return [];
  return ids.split(',').map((id) => id.trim()).filter(Boolean);
};

const formatValue = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}${suffix}`;
};

const renderTable = (courses) => {
  if (!tableWrapper) return;
  if (!courses.length) {
    tableWrapper.innerHTML = '';
    return;
  }

  const headers = courses
    .map((course) => {
      return `
        <div class="course-title">${course.title || 'Course'}</div>
        <div>${course.description || ''}</div>
        <div class="badge">${course.badge || course.course || ''}</div>
      `;
    })
    .map((content) => `<td>${content}</td>`)
    .join('');

  const rows = [
    ['Course', (c) => c.course],
    ['Level', (c) => c.level],
    ['Mode', (c) => c.mode],
    ['Exam', (c) => c.exam],
    ['Location', (c) => c.location],
    ['Type', (c) => c.type],
    ['Fees (INR)', (c) => formatValue(c.fees)],
    ['Seats', (c) => formatValue(c.seats)],
    ['Placement (LPA)', (c) => formatValue(c.placement)],
    ['Rating', (c) => formatValue(c.rating)],
    ['Facilities', (c) => c.facilities],
    ['Specializations', (c) => c.specializations],
  ];

  const body = rows
    .map(([label, getter]) => {
      const cols = courses
        .map((course) => `<td>${formatValue(getter(course))}</td>`)
        .join('');
      return `<tr><th>${label}</th>${cols}</tr>`;
    })
    .join('');

  tableWrapper.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Overview</th>
          ${headers}
        </tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
    </table>
  `;
};

const loadCompare = async () => {
  const ids = getIdsFromQuery();
  if (!ids.length) {
    statusEl.textContent = 'Select at least two courses to compare.';
    return;
  }

  try {
    statusEl.textContent = 'Loading courses...';
    const response = await fetch(API_URL);
    if (!response.ok) {
      statusEl.textContent = 'Failed to load courses.';
      return;
    }
    const data = await response.json();
    const allCourses = Array.isArray(data) ? data : data.courses || [];
    const selected = allCourses.filter((course) => ids.includes(String(course.id)));
    if (!selected.length) {
      statusEl.textContent = 'No matching courses found for comparison.';
      return;
    }
    statusEl.textContent = '';
    renderTable(selected);
  } catch (error) {
    console.error('Compare load failed:', error);
    statusEl.textContent = 'Error loading comparison.';
  }
};

loadCompare();
