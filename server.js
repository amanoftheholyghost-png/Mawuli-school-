const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== STUDENTS =====
app.get('/api/students', (req, res) => {
  res.json(db.prepare('SELECT * FROM students').all());
});

app.post('/api/students', (req, res) => {
  const { id, name, class: cls, phone } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'ID and name required' });
  try {
    db.prepare('INSERT INTO students (id, name, class, phone) VALUES (?, ?, ?, ?)')
      .run(id, name, cls || '', phone || '');
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Student ID already exists' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM fees WHERE student_id = ?').run(req.params.id);
  db.prepare('DELETE FROM student_attendance WHERE student_id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== FEES =====
app.get('/api/fees', (req, res) => {
  const rows = db.prepare(`
    SELECT f.id, f.amount, f.date, s.name AS studentName, s.id AS studentId
    FROM fees f JOIN students s ON s.id = f.student_id
    ORDER BY f.date DESC
  `).all();
  res.json(rows);
});

app.post('/api/fees', (req, res) => {
  const { studentId, amount, date } = req.body;
  if (!studentId || !amount || !date) return res.status(400).json({ error: 'Missing fields' });
  db.prepare('INSERT INTO fees (student_id, amount, date) VALUES (?, ?, ?)')
    .run(studentId, amount, date);
  res.json({ success: true });
});

app.delete('/api/fees/:id', (req, res) => {
  db.prepare('DELETE FROM fees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== STUDENT ATTENDANCE =====
app.get('/api/attendance/students', (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.date, a.status, s.name AS studentName, s.id AS studentId
    FROM student_attendance a JOIN students s ON s.id = a.student_id
    ORDER BY a.date DESC
  `).all();
  res.json(rows);
});

app.post('/api/attendance/students', (req, res) => {
  const { studentId, date, status } = req.body;
  if (!studentId || !date) return res.status(400).json({ error: 'Missing fields' });
  db.prepare(`
    INSERT INTO student_attendance (student_id, date, status)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
  `).run(studentId, date, status);
  res.json({ success: true });
});

app.delete('/api/attendance/students/:id', (req, res) => {
  db.prepare('DELETE FROM student_attendance WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== TEACHER ATTENDANCE =====
app.get('/api/attendance/teachers', (req, res) => {
  res.json(db.prepare('SELECT * FROM teacher_attendance ORDER BY date DESC').all());
});

app.post('/api/attendance/teachers', (req, res) => {
  const { name, date, status } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Missing fields' });
  db.prepare(`
    INSERT INTO teacher_attendance (teacher_name, date, status)
    VALUES (?, ?, ?)
    ON CONFLICT(teacher_name, date) DO UPDATE SET status = excluded.status
  `).run(name, date, status);
  res.json({ success: true });
});

app.delete('/api/attendance/teachers/:id', (req, res) => {
  db.prepare('DELETE FROM teacher_attendance WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
