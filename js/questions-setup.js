// Questions Setup Page JavaScript
let questions = [];
let topics = [];
let currentSurvey = null;
let isEditingSurvey = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadTopics();
    // Check for ?survey= parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const surveyName = urlParams.get('survey');
    if (surveyName) {
        // Load the survey by name from localStorage
        const surveys = JSON.parse(localStorage.getItem('surveys')) || [];
        const foundSurvey = surveys.find(s => s.name === surveyName);
        if (foundSurvey) {
            currentSurvey = foundSurvey;
            isEditingSurvey = true;
            questions = currentSurvey.questions ? [...currentSurvey.questions] : [];
            // Update UI for this survey
            document.getElementById('surveyInfo').style.display = 'block';
            document.getElementById('surveyName').textContent = currentSurvey.name;
            document.getElementById('surveyDescription').textContent = currentSurvey.description || '';
            document.getElementById('pageDescription').textContent = 'עריכת שאלות עבור הסקר הנבחר';
            updateUI();
        } else {
            // Survey not found, fallback
            checkIfEditingSurvey();
        }
    } else {
        checkIfEditingSurvey();
    }
});

// Check if we're editing a specific survey
function checkIfEditingSurvey() {
    const editingSurveyIndex = localStorage.getItem('editingSurveyIndex');
    
    if (editingSurveyIndex !== null) {
        // We're editing a specific survey
        isEditingSurvey = true;
        const surveys = JSON.parse(localStorage.getItem('surveys')) || [];
        const surveyIndex = parseInt(editingSurveyIndex);
        
        if (surveys[surveyIndex]) {
            currentSurvey = surveys[surveyIndex];
            questions = currentSurvey.questions ? [...currentSurvey.questions] : [];
            
            // Update page UI to show survey info
            updatePageForSurvey();
            
            // Clear the editing index from localStorage
            localStorage.removeItem('editingSurveyIndex');
            
            // Update UI immediately with loaded questions
            updateUI();
            
            // Show success message
            showSuccessMessage(`הסקר "${currentSurvey.name}" נטען בהצלחה`);
        } else {
            // Survey not found, fall back to global questions
            isEditingSurvey = false;
            loadGlobalQuestions();
            updateUI();
        }
    } else {
        // We're managing global questions
        isEditingSurvey = false;
        loadGlobalQuestions();
        updateUI();
    }
}

// Load global questions from localStorage
function loadGlobalQuestions() {
    const stored = localStorage.getItem('questions');
    questions = stored ? JSON.parse(stored) : [];
}

// Load questions from localStorage (now handles both global and survey-specific)
function loadQuestions() {
    if (isEditingSurvey && currentSurvey) {
        questions = currentSurvey.questions ? [...currentSurvey.questions] : [];
    } else {
        loadGlobalQuestions();
    }
}

// Update page UI for survey editing
function updatePageForSurvey() {
    if (currentSurvey) {
        // Show survey info
        document.getElementById('surveyInfo').style.display = 'block';
        document.getElementById('surveyName').textContent = currentSurvey.name;
        document.getElementById('surveyDescription').textContent = currentSurvey.description || 'אין תיאור';
        
        // Update page description
        document.getElementById('pageDescription').textContent = 'עריכת שאלות עבור הסקר הנבחר';
        
        // Update back link
        const backLink = document.getElementById('backLink');
        backLink.textContent = '⬅ חזרה לניהול סקרים';
        backLink.href = 'survey-management.html';
    }
}

// Save questions to localStorage
function saveQuestions() {
    if (isEditingSurvey && currentSurvey) {
        // Save to the specific survey
        const surveys = JSON.parse(localStorage.getItem('surveys')) || [];
        const surveyIndex = surveys.findIndex(s => s.name === currentSurvey.name);
        
        if (surveyIndex !== -1) {
            surveys[surveyIndex].questions = [...questions];
            localStorage.setItem('surveys', JSON.stringify(surveys));
            
            // Update current survey reference
            currentSurvey = surveys[surveyIndex];
        }
    } else {
        // Save to global questions
        localStorage.setItem('questions', JSON.stringify(questions));
    }
}

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
    const questionsList = document.getElementById('questionsList');
    const emptyState = document.getElementById('emptyState');
    
    if (questions.length === 0) {
        questionsList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        questionsList.style.display = 'block';
        emptyState.style.display = 'none';
        renderQuestions();
    }
}

// Render questions list
function renderQuestions() {
    const questionsList = document.getElementById('questionsList');
    
    if (questions.length === 0) {
        questionsList.innerHTML = '';
        questionsList.classList.remove('has-questions');
        return;
    }
    
    const typeLabels = {
        'free-text': 'שאלת טקסט חופשי',
        'rating-1-5': 'שאלת דירוג 1-5',
        'status-ok': 'שאלת תקין/חלקי/לא תקין'
    };
    
    const questionsHTML = questions.map((question, index) => {
        const typeLabel = typeLabels[question.itemType] || question.itemType;
        
        return `
            <div class="question-item" data-index="${index}">
                <div class="question-header">
                    <h3 class="question-title">${question.itemName}</h3>
                    <span class="question-type">${typeLabel}</span>
                </div>
                <div class="question-content">
                    <strong>שאלה:</strong> ${question.questionText || 'לא צוין'}<br>
                    <strong>נושא:</strong> ${question.topic || 'לא צוין'}
                </div>
                <div class="question-meta">
                    <span>נוצר: ${new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div class="question-actions">
                    <button class="btn btn-secondary" onclick="editQuestion(${index})">ערוך</button>
                    <button class="btn btn-secondary" onclick="deleteQuestion(${index})">מחק</button>
                </div>
            </div>
        `;
    }).join('');
    
    questionsList.innerHTML = questionsHTML;
    questionsList.classList.add('has-questions');
}

// Modal functions
function openQuestionModal(questionIndex = null) {
    const modal = document.getElementById('questionModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('questionForm');
    
    // Reset form
    form.reset();
    
    // Set Item Name to current survey name and lock it
    const itemNameInput = document.getElementById('itemName');
    if (currentSurvey && currentSurvey.name) {
        itemNameInput.value = currentSurvey.name;
    } else {
        itemNameInput.value = '';
    }
    itemNameInput.readOnly = true;
    
    // Show fields for default type immediately
    handleItemTypeChange();
    
    // Update modal title
    if (questionIndex !== null) {
        modalTitle.textContent = 'עריכת שאלה';
        // Load question data for editing
        loadQuestionForEdit(questionIndex);
    } else {
        modalTitle.textContent = 'הוספת שאלה חדשה';
    }
    
    // Load topics in dropdown
    loadTopicsInDropdown();
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeQuestionModal() {
    const modal = document.getElementById('questionModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Reset form
    document.getElementById('questionForm').reset();
    document.getElementById('questionFields').style.display = 'none';
}

function openTopicsModal() {
    // Navigate to the dedicated topics management page
    window.location.href = 'topics-management.html';
}



// Handle item type change
function handleItemTypeChange() {
    const itemType = document.getElementById('itemType').value;
    const questionFields = document.getElementById('questionFields');
    // Always show question fields for the three allowed types
    questionFields.style.display = 'block';
    // Update required fields
    const questionText = document.getElementById('questionText');
    const topic = document.getElementById('topic');
    questionText.required = true;
    topic.required = true;
    // Load topics in dropdown
    loadTopicsInDropdown();
}

// Load topics in dropdown
function loadTopicsInDropdown() {
    const topicSelect = document.getElementById('topic');
    const currentValue = topicSelect.value;
    
    topicSelect.innerHTML = '<option value="">בחר נושא</option>';
    
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        topicSelect.appendChild(option);
    });
    
    // Restore previous value if editing
    if (currentValue) {
        topicSelect.value = currentValue;
    }
}

// Save question
function saveQuestion() {
    const form = document.getElementById('questionForm');
    const formData = new FormData(form);
    const itemType = formData.get('itemType');
    // Only allow the three types
    if (!["free-text", "rating-1-5", "status-ok"].includes(itemType)) {
        alert('סוג שאלה לא חוקי');
        return;
    }
    const questionData = {
        itemName: formData.get('itemName'),
        itemType: itemType,
        questionText: formData.get('questionText'),
        topic: formData.get('topic'),
        createdAt: new Date().toISOString()
    };
    // Validation
    if (!questionData.itemName || !questionData.itemType || !questionData.questionText || !questionData.topic) {
        alert('אנא מלא את כל השדות הנדרשים');
        return;
    }
    // Check if editing existing question
    const editingIndex = form.dataset.editingIndex;
    if (editingIndex !== undefined) {
        questions[parseInt(editingIndex)] = questionData;
        delete form.dataset.editingIndex;
    } else {
        questions.push(questionData);
    }
    saveQuestions();
    updateUI();
    closeQuestionModal();
    showSuccessMessage(editingIndex !== undefined ? 'השאלה עודכנה בהצלחה' : 'השאלה נוספה בהצלחה');
}

// Load question for editing
function loadQuestionForEdit(index) {
    const question = questions[index];
    const form = document.getElementById('questionForm');
    
    // Set form data
    const itemNameInput = document.getElementById('itemName');
    if (currentSurvey && currentSurvey.name) {
        itemNameInput.value = currentSurvey.name;
    } else {
        itemNameInput.value = '';
    }
    itemNameInput.readOnly = true;
    document.getElementById('itemType').value = question.itemType;
    document.getElementById('questionText').value = question.questionText || '';
    document.getElementById('topic').value = question.topic || '';
    
    // Store editing index
    form.dataset.editingIndex = index;
    
    // Show/hide question fields based on type
    handleItemTypeChange();
}

// Edit question
function editQuestion(index) {
    openQuestionModal(index);
}

// Delete question
function deleteQuestion(index) {
    if (confirm('האם אתה בטוח שברצונך למחוק שאלה זו?')) {
        questions.splice(index, 1);
        saveQuestions();
        updateUI();
        showSuccessMessage('השאלה נמחקה בהצלחה');
    }
}



// Show success message
function showSuccessMessage(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        animation: slideInRight 0.3s ease;
    `;
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

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const questionModal = document.getElementById('questionModal');
    
    if (event.target === questionModal) {
        closeQuestionModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeQuestionModal();
    }
});

// Add CSS animations for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for use in other pages
window.QuestionsSetup = {
    getQuestions: () => questions,
    getTopics: () => topics,
    loadQuestions,
    saveQuestions,
    loadTopics,
    saveTopics
}; 
