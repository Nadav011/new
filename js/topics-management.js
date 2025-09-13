// Topics Management Page JavaScript
let topics = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadTopics();
    updateUI();
    
    // Add enter key support for adding topics
    document.getElementById('newTopicName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic();
        }
    });
});

// Load topics from localStorage
function loadTopics() {
    const stored = localStorage.getItem('topics');
    topics = stored ? JSON.parse(stored) : [];
    
    // Add default topics if none exist
    if (topics.length === 0) {
        topics = [
            'ניקיון',
            'שירות לקוחות',
            'איכות מזון',
            'מהירות שירות',
            'מחירים',
            'אטמוספירה',
            'בטיחות',
            'תחזוקה'
        ];
        saveTopics();
    }
}

// Save topics to localStorage
function saveTopics() {
    localStorage.setItem('topics', JSON.stringify(topics));
}

// Update the UI based on current state
function updateUI() {
    const topicsList = document.getElementById('topicsList');
    const emptyState = document.getElementById('emptyTopicsState');
    
    if (topics.length === 0) {
        topicsList.style.display = 'none';
        emptyState.classList.add('show');
    } else {
        topicsList.style.display = 'grid';
        emptyState.classList.remove('show');
        renderTopics();
    }
}

// Render topics list
function renderTopics() {
    const topicsList = document.getElementById('topicsList');
    
    const topicsHTML = topics.map((topic, index) => {
        return `
            <div class="topic-item" data-index="${index}">
                <div class="topic-info">
                    <h3 class="topic-name">${topic}</h3>
                    <p class="topic-meta">נושא מספר ${index + 1}</p>
                </div>
                <div class="topic-actions">
                    <button class="topic-edit" onclick="editTopic(${index})" title="ערוך נושא">
                        ✏️
                    </button>
                    <button class="topic-delete" onclick="deleteTopic(${index})" title="מחק נושא">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    topicsList.innerHTML = topicsHTML;
}

// Add new topic
function addTopic() {
    const topicNameInput = document.getElementById('newTopicName');
    const topicName = topicNameInput.value.trim();
    
    if (!topicName) {
        showError('אנא הכנס שם נושא');
        topicNameInput.focus();
        return;
    }
    
    if (topicName.length > 50) {
        showError('שם הנושא לא יכול להיות ארוך מ-50 תווים');
        topicNameInput.focus();
        return;
    }
    
    if (topics.includes(topicName)) {
        showError('נושא זה כבר קיים');
        topicNameInput.focus();
        return;
    }
    
    topics.push(topicName);
    saveTopics();
    updateUI();
    
    // Clear input
    topicNameInput.value = '';
    topicNameInput.focus();
    
    showSuccess('הנושא נוסף בהצלחה');
}

// Edit topic
function editTopic(index) {
    const topic = topics[index];
    const newName = prompt('ערוך שם נושא:', topic);
    
    if (newName === null) {
        return; // User cancelled
    }
    
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
        showError('שם הנושא לא יכול להיות ריק');
        return;
    }
    
    if (trimmedName.length > 50) {
        showError('שם הנושא לא יכול להיות ארוך מ-50 תווים');
        return;
    }
    
    if (trimmedName === topic) {
        return; // No change
    }
    
    if (topics.includes(trimmedName)) {
        showError('נושא זה כבר קיים');
        return;
    }
    
    topics[index] = trimmedName;
    saveTopics();
    updateUI();
    
    showSuccess('הנושא עודכן בהצלחה');
}

// Delete topic
function deleteTopic(index) {
    const topic = topics[index];
    
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הנושא "${topic}"?`)) {
        return;
    }
    
    topics.splice(index, 1);
    saveTopics();
    updateUI();
    
    showSuccess('הנושא נמחק בהצלחה');
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
        animation: slideInRight 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 4000);
}

// Export functions for use in other pages
window.TopicsManagement = {
    getTopics: () => topics,
    loadTopics,
    saveTopics
}; 