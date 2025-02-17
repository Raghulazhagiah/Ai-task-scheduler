document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('task-list');

    const email_id = localStorage.getItem('email_id');
    console.log("Email ID from local storage", email_id)
// Fetch existing tasks on page load
fetch(`http://localhost:3002/get/${email_id}`)
    .then(response => response.json())
    .then(data => {
        data.forEach(task => {
            addTaskToList(task.name, task.task, task.email, task.id, task.summary, task.to_do_list);
        });
    })
    .catch(error => {
        console.error('Error fetching tasks:', error);
    });


    // Handle form submission
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
    
        const name = document.getElementById('name').value;
        const task = document.getElementById('task').value;
        const email = 0 // Assuming default email value as 0        
        // if (!email) {
        //     console.error("User ID or email not found.");
        //     return; // Add error handling if needed
        // }
    
        fetch('http://localhost:3002/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, task, email, email_id}) // Include email in request body
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                addTaskToList(name, task, email, data.id );
                taskForm.reset();
            }
        })
        .catch(error => console.error('Error:', error));
    });
    


    function addTaskToList(name, task, email, taskId, summary, to_do_list) {
        const li = document.createElement('li');
        li.textContent = `${name}: ${task}`;
    
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.onclick = function() {
            deleteTask(name, li);
        };
    
        // Conditionally add buttons if email is 1
        if (email == 1) {
            const replyButton = document.createElement('button');
            replyButton.textContent = 'Reply';
            replyButton.classList.add('reply-btn');
            replyButton.onclick = function(){
                window.location.href = `http://127.0.0.1:5500/Frontend/email-details.html?taskId=${taskId}`;
            }
    
            const summaryButton = document.createElement('button');
            summaryButton.classList.add('summary-btn');
            summaryButton.innerHTML = '📄'; // Icon for summary
    
            const todoButton = document.createElement('button');
            todoButton.classList.add('todo-btn');
            todoButton.innerHTML = '📝'; // Icon for to-do list
    
            const summaryTextArea = document.createElement('textarea');
            summaryTextArea.classList.add('summary-text');
            summaryTextArea.readOnly = true;
            summaryTextArea.value = summary;
    
            const todoTextArea = document.createElement('textarea');
            todoTextArea.classList.add('todo-text');
            todoTextArea.readOnly = true;
            todoTextArea.value = to_do_list;
    
            // Toggle summary text area visibility
            summaryButton.onclick = function() {
                summaryTextArea.style.display = summaryTextArea.style.display === 'none' ? 'block' : 'none';
            };
    
            // Toggle to-do list text area visibility
            todoButton.onclick = function() {
                todoTextArea.style.display = todoTextArea.style.display === 'none' ? 'block' : 'none';
            };
    
            li.appendChild(replyButton);
            li.appendChild(summaryButton);
            li.appendChild(todoButton);
            li.appendChild(summaryTextArea);
            li.appendChild(todoTextArea);
        }
    
        li.appendChild(deleteButton);
        taskList.appendChild(li);
    }
    
    
    
    
    

    function deleteTask(name, listItem) {
        fetch('http://localhost:3002/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, userId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Record deleted successfully') {
                listItem.remove();
            }
        })
        .catch(error => console.error('Error:', error));
    }
});
