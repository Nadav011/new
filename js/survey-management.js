// Survey Management Page JavaScript
let surveys = [];
let topics = [];
let currentSurveyQuestions = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadSurveys();
    loadTopics();
    updateUI();
});

// Load surveys from localStorage
function loadSurveys() {
    const stored = localStorage.getItem('surveys');
    surveys = stored ? JSON.parse(stored) : [];
}

// Save surveys to localStorage
function saveSurveys() {
    localStorage.setItem('surveys', JSON.stringify(surveys));
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
    const surveysList = document.getElementById('surveysList');
    const emptyState = document.getElementById('emptyState');
    
    if (surveys.length === 0) {
        surveysList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        surveysList.style.display = 'block';
        emptyState.style.display = 'none';
        renderSurveys();
    }
}

// Render surveys list
function renderSurveys() {
    const surveysList = document.getElementById('surveysList');
    
    if (surveys.length === 0) {
        surveysList.innerHTML = '';
        return;
    }
    
    const surveysHTML = surveys.map((survey, index) => {
        const questionCount = survey.questions ? survey.questions.length : 0;
        const createdDate = new Date(survey.createdAt).toLocaleDateString('he-IL');
        
        // Create questions preview
        let questionsPreview = '';
        if (survey.questions && survey.questions.length > 0) {
            const previewQuestions = survey.questions.slice(0, 3); // Show first 3 questions
            questionsPreview = `
                <div class="survey-questions-preview">
                    <h5>שאלות הסקר (${questionCount})</h5>
                    ${previewQuestions.map(q => `
                        <div class="question-preview-item">
                            <span class="question-type-badge">${getQuestionTypeLabel(q.itemType)}</span>
                            <span>${q.itemName}</span>
                        </div>
                    `).join('')}
                    ${questionCount > 3 ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">+${questionCount - 3} שאלות נוספות</div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="survey-item" data-index="${index}">
                <div class="survey-header">
                    <div>
                        <h3 class="survey-title">${survey.name}</h3>
                        <p class="survey-description">${survey.description || 'אין תיאור'}</p>
                        <div class="survey-meta">
                            <span>נוצר: ${createdDate}</span>
                            <span>שאלות: ${questionCount}</span>
                        </div>
                    </div>
                </div>
                ${questionsPreview}
                <div class="survey-actions">
                    <button class="btn btn-primary" onclick="editSurvey(${index})">ערוך סקר</button>
                    <button class="btn btn-secondary" onclick="duplicateSurvey(${index})">שכפל</button>
                    <button class="btn btn-danger" onclick="deleteSurvey(${index})">מחק</button>
                </div>
            </div>
        `;
    }).join('');
    
    surveysList.innerHTML = surveysHTML;
    surveysList.classList.add('has-surveys');
}

// Get question type label
function getQuestionTypeLabel(itemType) {
    const labels = {
        'group-title': 'כותרת',
        'free-text': 'טקסט',
        'rating-1-5': 'דירוג',
        'status-ok': 'סטטוס'
    };
    return labels[itemType] || itemType;
}

// Modal functions
function openSurveyModal(surveyIndex = null) {
    const modal = document.getElementById('surveyModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('surveyForm');
    
    // Reset form and questions
    form.reset();
    currentSurveyQuestions = [];
    
    // Update modal title
    if (surveyIndex !== null) {
        modalTitle.textContent = 'עריכת סקר';
        // Load survey data for editing
        loadSurveyForEdit(surveyIndex);
    } else {
        modalTitle.textContent = 'יצירת סקר חדש';
    }
    
    // Update questions display
    updateSurveyQuestionsDisplay();
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSurveyModal() {
    const modal = document.getElementById('surveyModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Reset form
    document.getElementById('surveyForm').reset();
    currentSurveyQuestions = [];
    updateSurveyQuestionsDisplay();
}

function openQuestionModal() {
    const modal = document.getElementById('questionModal');
    const form = document.getElementById('questionForm');
    
    // Reset form
    form.reset();
    document.getElementById('questionFields').style.display = 'none';
    
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
    
    if (itemType === 'group-title') {
        questionFields.style.display = 'none';
    } else {
        questionFields.style.display = 'block';
        
        // Update required fields
        const questionText = document.getElementById('questionText');
        const topic = document.getElementById('topic');
        
        questionText.required = true;
        topic.required = true;
        
        // Load topics in dropdown
        loadTopicsInDropdown();
    }
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

// Add question to survey
function addQuestionToSurvey() {
    openQuestionModal();
}

// Save question to survey
function saveQuestionToSurvey() {
    const form = document.getElementById('questionForm');
    const formData = new FormData(form);
    
    const questionData = {
        itemName: formData.get('itemName'),
        itemType: formData.get('itemType'),
        questionText: formData.get('questionText'),
        topic: formData.get('topic')
    };
    
    // Validation
    if (!questionData.itemName || !questionData.itemType) {
        alert('אנא מלא את כל השדות הנדרשים');
        return;
    }
    
    if (questionData.itemType !== 'group-title') {
        if (!questionData.questionText || !questionData.topic) {
            alert('אנא מלא את כל השדות הנדרשים');
            return;
        }
    }
    
    // Add question to current survey
    currentSurveyQuestions.push(questionData);
    
    // Update display
    updateSurveyQuestionsDisplay();
    
    // Close modal
    closeQuestionModal();
    
    showSuccessMessage('השאלה נוספה לסקר');
}

// Update survey questions display
function updateSurveyQuestionsDisplay() {
    const questionsContainer = document.getElementById('surveyQuestions');
    
    if (currentSurveyQuestions.length === 0) {
        questionsContainer.innerHTML = `
            <div class="empty-questions-state">
                <div class="empty-icon">📝</div>
                <p>לא נוספו שאלות עדיין</p>
                <p class="empty-hint">לחץ על "הוסף שאלה" כדי להתחיל</p>
            </div>
        `;
        questionsContainer.classList.remove('has-questions');
    } else {
        const questionsHTML = currentSurveyQuestions.map((question, index) => {
            const typeLabel = getQuestionTypeLabel(question.itemType);
            
            if (question.itemType === 'group-title') {
                return `
                    <div class="survey-question-item group-title">
                        <div class="survey-question-info">
                            <div class="survey-question-title">${question.itemName}</div>
                            <div class="survey-question-meta">
                                <span class="type-badge group">כותרת קבוצה</span>
                            </div>
                        </div>
                        <div class="survey-question-actions">
                            <button class="btn btn-secondary btn-sm" onclick="removeQuestionFromSurvey(${index})">הסר</button>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="survey-question-item">
                        <div class="survey-question-info">
                            <div class="survey-question-title">${question.itemName}</div>
                            <div class="survey-question-text">${question.questionText}</div>
                            <div class="survey-question-meta">
                                <span class="type-badge">${typeLabel}</span>
                                <span class="topic-badge">${question.topic}</span>
                                <span class="score-badge">ציון: 10</span>
                            </div>
                        </div>
                        <div class="survey-question-actions">
                            <button class="btn btn-secondary btn-sm" onclick="removeQuestionFromSurvey(${index})">הסר</button>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        questionsContainer.innerHTML = questionsHTML;
        questionsContainer.classList.add('has-questions');
    }
}

// Remove question from survey
function removeQuestionFromSurvey(index) {
    if (confirm('האם אתה בטוח שברצונך להסיר שאלה זו?')) {
        currentSurveyQuestions.splice(index, 1);
        updateSurveyQuestionsDisplay();
        showSuccessMessage('השאלה הוסרה מהסקר');
    }
}

// Save survey
function saveSurvey() {
    const form = document.getElementById('surveyForm');
    const formData = new FormData(form);
    
    const surveyData = {
        name: formData.get('surveyName'),
        description: formData.get('surveyDescription'),
        questions: currentSurveyQuestions,
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!surveyData.name) {
        alert('אנא הכנס שם לסקר');
        return;
    }
    
    // Check if editing existing survey
    const editingIndex = form.dataset.editingIndex;
    
    if (editingIndex !== undefined) {
        // Update existing survey
        surveys[parseInt(editingIndex)] = surveyData;
        delete form.dataset.editingIndex;
    } else {
        // Add new survey
        surveys.push(surveyData);
    }
    
    saveSurveys();
    updateUI();
    closeSurveyModal();
    
    // Show success message
    showSuccessMessage(editingIndex !== undefined ? 'הסקר עודכן בהצלחה' : 'הסקר נוצר בהצלחה');
}

// Load survey for editing
function loadSurveyForEdit(index) {
    const survey = surveys[index];
    const form = document.getElementById('surveyForm');
    
    // Set form data
    document.getElementById('surveyName').value = survey.name;
    document.getElementById('surveyDescription').value = survey.description || '';
    
    // Load questions
    currentSurveyQuestions = survey.questions ? [...survey.questions] : [];
    updateSurveyQuestionsDisplay();
    
    // Store editing index
    form.dataset.editingIndex = index;
}

// Edit survey
function editSurvey(index) {
    // Store the survey index in localStorage for the questions setup page
    localStorage.setItem('editingSurveyIndex', index);
    // Navigate to questions setup page
    window.location.href = 'questions-setup.html';
}

// Duplicate survey
function duplicateSurvey(index) {
    const originalSurvey = surveys[index];
    const duplicatedSurvey = {
        ...originalSurvey,
        name: `${originalSurvey.name} (עותק)`,
        createdAt: new Date().toISOString()
    };
    
    surveys.push(duplicatedSurvey);
    saveSurveys();
    updateUI();
    
    showSuccessMessage('הסקר שוכפל בהצלחה');
}

// Delete survey
function deleteSurvey(index) {
    const survey = surveys[index];
    
    if (confirm(`האם אתה בטוח שברצונך למחוק את הסקר "${survey.name}"?`)) {
        surveys.splice(index, 1);
        saveSurveys();
        updateUI();
        showSuccessMessage('הסקר נמחק בהצלחה');
    }
}

// Add topic
function addTopic() {
    const topicName = document.getElementById('newTopicName').value.trim();
    
    if (!topicName) {
        alert('אנא הכנס שם נושא');
        return;
    }
    
    if (topics.includes(topicName)) {
        alert('נושא זה כבר קיים');
        return;
    }
    
    topics.push(topicName);
    saveTopics();
    renderTopicsList();
    document.getElementById('newTopicName').value = '';
    
    showSuccessMessage('הנושא נוסף בהצלחה');
}

// Delete topic
function deleteTopic(topicName) {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הנושא "${topicName}"?`)) {
        const index = topics.indexOf(topicName);
        if (index > -1) {
            topics.splice(index, 1);
            saveTopics();
            renderTopicsList();
            showSuccessMessage('הנושא נמחק בהצלחה');
        }
    }
}

// Render topics list
function renderTopicsList() {
    const topicsList = document.getElementById('topicsList');
    
    const topicsHTML = topics.map(topic => `
        <div class="topic-item">
            <span class="topic-name">${topic}</span>
            <button class="topic-delete" onclick="deleteTopic('${topic}')" title="מחק נושא">×</button>
        </div>
    `).join('');
    
    topicsList.innerHTML = topicsHTML;
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
    const surveyModal = document.getElementById('surveyModal');
    const questionModal = document.getElementById('questionModal');
    
    if (event.target === surveyModal) {
        closeSurveyModal();
    }
    
    if (event.target === questionModal) {
        closeQuestionModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSurveyModal();
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
window.SurveyManagement = {
    getSurveys: () => surveys,
    getTopics: () => topics,
    loadSurveys,
    saveSurveys,
    loadTopics,
    saveTopics
}; 