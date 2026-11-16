// public/main.js — клієнтська логіка: Fetch API + сповіщення Notyf
const notyf = new Notyf({
  duration: 3500,
  position: { x: 'right', y: 'top' },
  dismissible: true,
  types: [
    { type: 'success', background: '#38a169' },
    { type: 'error', background: '#e53e3e' }
  ]
});

const form = document.getElementById('task-form');
const input = document.getElementById('title-input');
const list = document.getElementById('task-list');

// Універсальний запит до API + показ сповіщення за статусом відповіді
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    let data = {};
    try { data = await response.json(); } catch (e) { /* порожнє тіло */ }

    if (response.status === 200 || response.status === 201) {
      notyf.success(data.message || 'Операцію виконано успішно');
      return { ok: true, data };
    }
    // 400, 404 та інші помилки
    notyf.error(data.error || `Помилка сервера (${response.status})`);
    return { ok: false, data };
  } catch (err) {
    notyf.error('Не вдалося зв\'язатися із сервером');
    return { ok: false };
  }
}

// Створення елемента <li> для нової задачі
function createTaskItem(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  if (task.completed) li.classList.add('completed');
  li.innerHTML =
    '<span class="title"></span>' +
    '<span class="badge">Виконано</span>' +
    '<button class="btn toggle" type="button">Змінити статус</button>' +
    '<button class="btn remove" type="button">Видалити</button>';
  li.querySelector('.title').textContent = `${task.id}. ${task.title}`;
  return li;
}

// Додавання задачі (POST)
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await apiRequest('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.value })
  });
  if (result.ok) {
    list.appendChild(createTaskItem(result.data.task));
    const empty = document.getElementById('empty');
    if (empty) empty.remove();
    input.value = '';
  }
});

// Зміна статусу (PUT) та видалення (DELETE) — делегування подій
list.addEventListener('click', async (event) => {
  const li = event.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (event.target.classList.contains('toggle')) {
    const result = await apiRequest(`/api/tasks/${id}`, { method: 'PUT' });
    if (result.ok) li.classList.toggle('completed', result.data.task.completed);
  }
  if (event.target.classList.contains('remove')) {
    const result = await apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });
    if (result.ok) li.remove();
  }
});
