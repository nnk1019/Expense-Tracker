document.addEventListener('DOMContentLoaded', () => {
  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  const summaryContent = document.getElementById('summaryContent');
  const filterForm = document.getElementById('filterForm');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const budgetInput = document.getElementById('budget');
  let filteredExpenses = [...expenses];

  // Night/Day Toggle Functionality
  const themeBtn = document.getElementById('toggleThemeBtn');
  function updateThemeBtnText() {
    themeBtn.textContent = document.body.classList.contains('dark-mode') ? 'Day' : 'Night';
  }
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeBtnText();
  });
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
  updateThemeBtnText();

  function filterExpenses() {
    let start = startDateInput.value ? new Date(startDateInput.value) : null;
    let end = endDateInput.value ? new Date(endDateInput.value) : null;
    filteredExpenses = expenses.filter(exp => {
      let expDate = new Date(exp.date);
      if (start && expDate < start) return false;
      if (end && expDate > end) return false;
      return true;
    });
  }

  function getSummary(expenses) {
    let total = 0;
    let byClassification = {};
    let byCategory = {};
    let byMonth = {};

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      total += amount;

      // Classification
      if (exp.classification) {
        byClassification[exp.classification] = (byClassification[exp.classification] || 0) + amount;
      }

      // Category
      if (exp.category) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + amount;
      }

      // By Month (YYYY-MM)
      if (exp.date) {
        let month = exp.date.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + amount;
      }
    });

    return { total, byClassification, byCategory, byMonth };
  }

  function renderSummary() {
    const { total, byClassification, byCategory } = getSummary(filteredExpenses);
    let budget = parseFloat(budgetInput.value) || null;
    let budgetHtml = '';
    if (budget) {
      let percent = ((total / budget) * 100).toFixed(1);
      let color = percent > 100 ? 'text-danger' : percent > 80 ? 'text-warning' : 'text-success';
      budgetHtml = `<p><strong>Budget:</strong> $${budget.toFixed(2)}<br>
        <span class="${color}"><strong>${percent}%</strong> of budget used</span></p>`;
    }
    let html = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Totals</h5>
          <p><strong>Total Expenses:</strong> $${total.toFixed(2)}</p>
          ${budgetHtml}
          <p><strong>By Classification:</strong></p>
          <ul>
            ${Object.entries(byClassification).map(([cls, amt]) => `<li>${cls}: $${amt.toFixed(2)}</li>`).join('')}
          </ul>
          <p><strong>By Category:</strong></p>
          <ul>
            ${Object.entries(byCategory).map(([cat, amt]) => `<li>${cat}: $${amt.toFixed(2)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    summaryContent.innerHTML = html;
  }

  function renderTopCategories() {
    const { byCategory } = getSummary(filteredExpenses);
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let html = `<div class="card"><div class="card-header">Top Categories</div><ul class="list-group list-group-flush">`;
    if (sorted.length === 0) html += `<li class="list-group-item">No data</li>`;
    sorted.forEach(([cat, amt]) => {
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">
        ${cat}<span class="badge bg-primary rounded-pill">$${amt.toFixed(2)}</span>
      </li>`;
    });
    html += `</ul></div>`;
    document.getElementById('topCategories').innerHTML = html;
  }

  function renderRecentExpenses() {
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    let html = `<div class="card"><div class="card-header">Recent Expenses</div><ul class="list-group list-group-flush">`;
    if (sorted.length === 0) html += `<li class="list-group-item">No data</li>`;
    sorted.forEach(exp => {
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${exp.name} (${exp.category || 'No category'})</span>
        <span>$${parseFloat(exp.amount).toFixed(2)} <small class="text-muted">${exp.date}</small></span>
      </li>`;
    });
    html += `</ul></div>`;
    document.getElementById('recentExpenses').innerHTML = html;
  }

  // Chart.js Pie (by Category)
  let pieChart, barChart;
  function renderCategoryPie() {
    const { byCategory } = getSummary(filteredExpenses);
    const ctx = document.getElementById('categoryPie').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(byCategory),
        datasets: [{
          data: Object.values(byCategory),
          backgroundColor: [
            '#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#fd7e14',
            '#ffc107', '#28a745', '#20c997', '#17a2b8', '#343a40'
          ]
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#222' } }
        }
      }
    });
  }

  // Chart.js Bar (by Month)
  function renderMonthlyBar() {
    const { byMonth } = getSummary(filteredExpenses);
    const ctx = document.getElementById('monthlyBar').getContext('2d');
    if (barChart) barChart.destroy();
    const labels = Object.keys(byMonth).sort();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Expenses',
          data: labels.map(m => byMonth[m]),
          backgroundColor: '#007bff'
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#222' } }
        },
        scales: {
          x: { ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#222' } },
          y: { ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#222' } }
        }
      }
    });
  }

  function renderAll() {
    filterExpenses();
    renderSummary();
    renderTopCategories();
    renderRecentExpenses();
    renderCategoryPie();
    renderMonthlyBar();
  }

  filterForm.addEventListener('submit', e => {
    e.preventDefault();
    renderAll();
  });

const resetBtn = document.getElementById('resetFiltersBtn');
resetBtn.addEventListener('click', () => {
  startDateInput.value = '';
  endDateInput.value = '';
  budgetInput.value = '';
  renderAll();
});

  // Re-render charts on theme change
  themeBtn.addEventListener('click', () => {
    setTimeout(renderAll, 200);
  });

  renderAll();
});