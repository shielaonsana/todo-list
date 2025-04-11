const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'todoapp'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/api/tasks', (req, res) => {
    const status = req.query.status || 'all';
    const priority = req.query.priority || 'all';
    
    let query = 'SELECT * FROM tasks';
    const conditions = [];
    
    if (status !== 'all') {
        conditions.push(`status = '${status}'`);
    }
    
    if (priority !== 'all') {
        conditions.push(`priority = '${priority}'`);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    db.query('SELECT * FROM tasks WHERE id = ?', [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(results[0]);
    });
});

app.post('/api/tasks', (req, res) => {
    const { title, description, due_date, priority } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    const task = {
        title,
        description: description || '',
        due_date: due_date || null,
        priority: priority || 'medium',
        status: 'pending'
    };
    
    db.query('INSERT INTO tasks SET ?', task, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        db.query('SELECT * FROM tasks WHERE id = ?', result.insertId, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json(rows[0]);
        });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, due_date, priority, status } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    const task = {
        title,
        description: description || '',
        due_date: due_date || null,
        priority: priority || 'medium',
        status: status || 'pending'
    };
    
    db.query('UPDATE tasks SET ? WHERE id = ?', [task, taskId], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        db.query('SELECT * FROM tasks WHERE id = ?', taskId, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            res.json(rows[0]);
        });
    });
});

app.patch('/api/tasks/:id/status', (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['pending', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (pending/completed) is required' });
    }
    
    db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        db.query('SELECT * FROM tasks WHERE id = ?', taskId, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            res.json(rows[0]);
        });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    db.query('DELETE FROM tasks WHERE id = ?', taskId, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted successfully' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});