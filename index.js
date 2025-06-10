// Load expenses from localStorage if available, otherwise start with an empty array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Get references to the form and the list where expenses will be displayed
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');

// Render all expenses in the list with inline editing
function renderExpenses() {
  expenseList.innerHTML = '';
  expenses.forEach((expense, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';

    // Helper to create an editable field
    function createEditableField(field, value, type = 'text', options = null) {
      const span = document.createElement('span');
      span.textContent = value;
      span.style.cursor = 'pointer';

      span.addEventListener('click', () => {
        let input;
        if (type === 'select' && options) {
          input = document.createElement('select');
          options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (opt === value) option.selected = true;
            input.appendChild(option);
          });
        } else {
          input = document.createElement('input');
          input.type = type;
          input.value = value;
        }
        input.className = 'form-control form-control-sm d-inline-block';
        input.style.width = 'auto';
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') input.blur();
        });
        span.replaceWith(input);
        input.focus();

        function save() {
          let newValue = input.value;
          if (type === 'number') newValue = parseFloat(newValue) || 0;
          expenses[idx][field] = newValue;
          localStorage.setItem('expenses', JSON.stringify(expenses));
          renderExpenses();
        }
      });
      return span;
    }

    const row = document.createElement('div');
    row.className = 'row align-items-center';

    // Merchant Name
    const nameCol = document.createElement('div');
    nameCol.className = 'col-3 col-md-3 border-end';
    nameCol.appendChild(createEditableField('name', expense.name));
    row.appendChild(nameCol);

    // Classification (dropdown)
    const classCol = document.createElement('div');
    classCol.className = 'col-2 col-md-2 border-end text-center';
    classCol.appendChild(createEditableField('classification', expense.classification, 'select', ['Business', 'Personal']));
    row.appendChild(classCol);

    // Category
    const catCol = document.createElement('div');
    catCol.className = 'col-2 col-md-2 border-end text-center';
    catCol.appendChild(createEditableField('category', expense.category));
    row.appendChild(catCol);

    // Amount
    const amtCol = document.createElement('div');
    amtCol.className = 'col-2 col-md-2 border-end text-center';
    amtCol.appendChild(createEditableField('amount', parseFloat(expense.amount).toFixed(2), 'number'));
    row.appendChild(amtCol);

    // Date
    const dateCol = document.createElement('div');
    dateCol.className = 'col-2 col-md-2 border-end text-center';
    dateCol.appendChild(createEditableField('date', expense.date, 'date'));
    row.appendChild(dateCol);

    // Delete button
    const btnCol = document.createElement('div');
    btnCol.className = 'col-1 col-md-1 text-end';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      expenses.splice(idx, 1);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      renderExpenses();
    });
    btnCol.appendChild(delBtn);
    row.appendChild(btnCol);

    li.appendChild(row);
    expenseList.appendChild(li);
  });
}

// Handle form submission to add a new expense
expenseForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('expenseName').value.trim();
  const classification = document.getElementById('expenseClassification').value.trim();
  const category = document.getElementById('expenseCategory').value.trim();
  const amount = document.getElementById('expenseAmount').value;
  const date = document.getElementById('expenseDate').value;
  if (!name || !amount || !date) return;

  expenses.push({ name, classification, category, amount, date });
  localStorage.setItem('expenses', JSON.stringify(expenses));
  renderExpenses();
  expenseForm.reset();
});

// Day/Night Toggle Functionality
const themeBtn = document.getElementById('toggleThemeBtn');
function updateThemeBtnText() {
  themeBtn.textContent = document.body.classList.contains('dark-mode') ? 'Day' : 'Night';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  updateThemeBtnText();
});

// On page load, set theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}
updateThemeBtnText();

// Initial render of expenses when the page loads
renderExpenses();