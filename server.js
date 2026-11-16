// server.js — ПЗ №6: To-Do List + валідація Joi
const express = require('express');
const path = require('path');
const Joi = require('joi');

const app = express();
const PORT = 3000;

// ---------- Налаштування Express ----------
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());                                   // парсинг JSON
app.use(express.static(path.join(__dirname, 'public')));   // клієнтський main.js

// ---------- Схема валідації Joi ----------
const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Назва задачі має бути рядком',
    'string.empty': 'Назва задачі не може бути порожньою',
    'string.min': 'Назва задачі має містити щонайменше {#limit} символи',
    'string.max': 'Назва задачі має містити не більше {#limit} символів',
    'any.required': 'Поле "title" є обов\'язковим'
  })
});

// ---------- Імітація бази даних ----------
let tasks = [
  { id: 1, title: 'Встановити Node.js та npm', completed: true },
  { id: 2, title: 'Налаштувати Express.js', completed: false },
  { id: 3, title: 'Створити шаблони Pug', completed: false }
];
let nextId = 4;

// ---------- API-маршрути (JSON) ----------

// READ ALL
app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// CREATE (з валідацією Joi)
app.post('/api/tasks', (req, res) => {
  const { error, value } = taskSchema.validate(req.body || {});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const newTask = { id: nextId++, title: value.title, completed: false };
  tasks.push(newTask);
  res.status(201).json({ message: 'Задачу успішно створено', task: newTask });
});

// UPDATE STATUS
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: `Задачу з id ${req.params.id} не знайдено` });
  }
  task.completed = !task.completed;
  res.status(200).json({
    message: `Статус змінено: задача ${task.completed ? 'виконана' : 'не виконана'}`,
    task
  });
});

// DELETE
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Задачу з id ${req.params.id} не знайдено` });
  }
  tasks.splice(index, 1);
  res.status(200).json({ message: 'Задачу успішно видалено' });
});

// ---------- Сторінки (Pug) ----------
app.get('/', (req, res) => res.redirect('/tasks'));

app.get('/tasks', (req, res) => {
  res.render('tasks', { title: 'Список справ', tasks });
});

// ---------- Обробка некоректного JSON ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}/tasks`);
});
