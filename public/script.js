document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('add-task-form');
    const taskList = document.getElementById('task-list');
    const statusFilter = document.getElementById('filter-status');
    const priorityFilter = document.getElementById('filter-priority');
    
    let currentEditId = null;
    
    const API_URL = 'http://localhost:3000/api';
    
    loadTasks();
    
    addTaskForm.addEventListener('submit', handleFormSubmit);
    statusFilter.addEventListener('change', loadTasks);
    priorityFilter.addEventListener('change', loadTasks);
    
    taskList.addEventListener('click', function(e) {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        
        if (target.classList.contains('task-checkbox')) {
            const status = target.checked ? 'completed' : 'pending';
            updateTaskStatus(taskId, status);
        }
        
        if (target.classList.contains('btn-edit')) {
            editTask(taskId);
        }
        
        if (target.classList.contains('btn-delete')) {
            deleteTask(taskId);
        }
    });
    
    function loadTasks() {
        const statusValue = statusFilter.value;
        const priorityValue = priorityFilter.value;
        
        fetch(`${API_URL}/tasks?status=${statusValue}&priority=${priorityValue}`)
            .then(response => response.json())
            .then(tasks => {
                renderTasks(tasks);
            })
            .catch(error => {
                console.error('Error loading tasks:', error);
                alert('Failed to load tasks. Please try again.');
            });
    }
    
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="no-tasks">No tasks found.</div>';
            return;
        }
        
        tasks.forEach(task => {
            const formattedDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
            
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
            taskElement.dataset.id = task.id;
            taskElement.dataset.status = task.status;
            taskElement.dataset.priority = task.priority;
            
            taskElement.innerHTML = `
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}>
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <div class="task-actions">
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                </div>
                <div class="task-body">
                    <p class="task-description">${escapeHtml(task.description) || 'No description'}</p>
                    <div class="task-meta">
                        <span class="task-due-date">${formattedDate}</span>
                        <span class="task-priority ${task.priority}">${capitalize(task.priority)}</span>
                    </div>
                </div>
            `;
            
            taskList.appendChild(taskElement);
        });
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('task-title');
        const descriptionInput = document.getElementById('task-description');
        const dueDateInput = document.getElementById('due-date');
        const priorityInput = document.getElementById('priority');
        
        const taskData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            due_date: dueDateInput.value || null,
            priority: priorityInput.value
        };
        
        if (!taskData.title) {
            alert('Task title is required');
            return;
        }
        
        if (currentEditId) {
            updateTask(currentEditId, taskData);
        } else {
            addTask(taskData);
        }
        
        addTaskForm.reset();
        document.getElementById('task-submit-btn').textContent = 'Add Task';
        currentEditId = null;
    }
    
    function addTask(taskData) {
        fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add task');
            }
            return response.json();
        })
        .then(() => {
            loadTasks();
        })
        .catch(error => {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        });
    }
    
    function updateTask(taskId, taskData) {
        fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update task');
            }
            return response.json();
        })
        .then(() => {
            loadTasks();
        })
        .catch(error => {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        });
    }
    
    function updateTaskStatus(taskId, status) {
        fetch(`${API_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            return response.json();
        })
        .then(() => {
            loadTasks();
        })
        .catch(error => {
            console.error('Error updating task status:', error);
            alert('Failed to update task status. Please try again.');
        });
    }
    
    function editTask(taskId) {
        fetch(`${API_URL}/tasks/${taskId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Task not found');
                }
                return response.json();
            })
            .then(task => {
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description || '';
                document.getElementById('due-date').value = task.due_date ? task.due_date.split('T')[0] : '';
                document.getElementById('priority').value = task.priority;
                
                document.getElementById('task-submit-btn').textContent = 'Update Task';
                currentEditId = task.id;
                
                document.querySelector('.task-form').scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error fetching task for edit:', error);
                alert('Failed to load task for editing. Please try again.');
            });
    }
    
    function deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete task');
            }
            return response.json();
        })
        .then(() => {
            loadTasks();
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
        });
    }
    
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});