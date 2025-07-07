document.addEventListener("DOMContentLoaded", () => {
  loadReviewData();
});

function loadReviewData() {
  // Get review data from localStorage
  const reviewData = JSON.parse(localStorage.getItem('currentReview') || '{}');
  
  if (!reviewData || Object.keys(reviewData).length === 0) {
    showError('לא נמצאו נתוני ביקורת');
    return;
  }

  // Load branch information
  loadBranchInfo(reviewData);
  
  // Load review metadata
  loadReviewMetadata(reviewData);
  
  // Load questions and answers
  loadQuestionsAndAnswers(reviewData);
  
  // Load summary information
  loadSummaryInfo(reviewData);
}

function loadBranchInfo(reviewData) {
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  const branch = branches.find(b => b.name === reviewData.branch);
  
  if (branch) {
    document.getElementById('branchName').textContent = branch.name || 'לא צוין';
    document.getElementById('branchAddress').textContent = branch.address || 'לא צוין';
    document.getElementById('managerName').textContent = branch.managerName || 'לא צוין';
    document.getElementById('managerPhone').textContent = branch.managerPhone || 'לא צוין';
  } else {
    document.getElementById('branchName').textContent = reviewData.branch || 'לא צוין';
    document.getElementById('branchAddress').textContent = 'לא נמצאו פרטי סניף';
    document.getElementById('managerName').textContent = 'לא צוין';
    document.getElementById('managerPhone').textContent = 'לא צוין';
  }
}

function loadReviewMetadata(reviewData) {
  // Format date
  const reviewDate = reviewData.date ? new Date(reviewData.date).toLocaleDateString('he-IL') : 'לא צוין';
  
  document.getElementById('reviewDate').textContent = reviewDate;
  document.getElementById('reviewerName').textContent = reviewData.reviewer || 'לא צוין';
  document.getElementById('reviewType').textContent = reviewData.type || 'לא צוין';
  
  // Calculate and display total score
  const totalScore = calculateTotalScore(reviewData);
  const scoreElement = document.getElementById('totalScore');
  scoreElement.textContent = `${totalScore.toFixed(1)}/10`;
  
  // Color code the score
  if (totalScore >= 8) {
    scoreElement.style.color = '#10b981';
  } else if (totalScore >= 6) {
    scoreElement.style.color = '#f59e0b';
  } else {
    scoreElement.style.color = '#ef4444';
  }
}

function loadQuestionsAndAnswers(reviewData) {
  const questionsContainer = document.getElementById('questionsContainer');
  questionsContainer.innerHTML = '';
  
  const questions = reviewData.questions || [];
  const answers = reviewData.answers || {};
  
  if (questions.length === 0) {
    questionsContainer.innerHTML = '<p class="no-questions">לא נמצאו שאלות לביקורת זו</p>';
    return;
  }
  
  let currentGroup = null;
  
  questions.forEach((question, index) => {
    // Check if this is a group title
    if (question.type === 'group-title') {
      currentGroup = question.text;
      const groupElement = createGroupTitleElement(question);
      questionsContainer.appendChild(groupElement);
      return;
    }
    
    // Create question element
    const questionElement = createQuestionElement(question, answers[question.id] || answers[index], index);
    questionsContainer.appendChild(questionElement);
  });
}

function createGroupTitleElement(groupQuestion) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'question-item group-title';
  
  groupDiv.innerHTML = `
    <div class="question-header">
      <h3 class="question-title">${groupQuestion.text}</h3>
      <span class="question-type">קבוצת שאלות</span>
    </div>
  `;
  
  return groupDiv;
}

function createQuestionElement(question, answer, index) {
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-item';
  
  const questionType = getQuestionTypeLabel(question.type);
  const questionMeta = getQuestionMeta(question);
  
  let answerContent = '';
  
  if (question.type === 'text') {
    answerContent = `
      <div class="question-answer">
        <p class="answer-text">${answer || 'לא נענה'}</p>
      </div>
    `;
  } else if (question.type === 'score') {
    const score = answer || 0;
    const scoreColor = score >= 8 ? 'ok' : score >= 6 ? 'partial' : 'not-ok';
    answerContent = `
      <div class="question-answer">
        <div class="answer-score">
          <span>⭐</span>
          <span>${score}/10</span>
        </div>
      </div>
    `;
  } else if (question.type === 'yes-no') {
    const status = answer === 'yes' ? 'ok' : answer === 'no' ? 'not-ok' : 'partial';
    const statusText = answer === 'yes' ? 'כן' : answer === 'no' ? 'לא' : 'לא נענה';
    answerContent = `
      <div class="question-answer">
        <div class="answer-status ${status}">
          <span>${answer === 'yes' ? '✅' : answer === 'no' ? '❌' : '❓'}</span>
          <span>${statusText}</span>
        </div>
      </div>
    `;
  } else if (question.type === 'multiple-choice') {
    const selectedOption = question.options ? question.options[answer] : answer;
    answerContent = `
      <div class="question-answer">
        <p class="answer-text">${selectedOption || 'לא נבחר'}</p>
      </div>
    `;
  }
  
  questionDiv.innerHTML = `
    <div class="question-header">
      <h3 class="question-title">${question.text}</h3>
      <span class="question-type">${questionType}</span>
    </div>
    <div class="question-content">
      ${questionMeta ? `<div class="question-meta">${questionMeta}</div>` : ''}
      ${answerContent}
    </div>
  `;
  
  return questionDiv;
}

function getQuestionTypeLabel(type) {
  const typeLabels = {
    'text': 'תשובה חופשית',
    'score': 'ציון 1-10',
    'yes-no': 'כן/לא',
    'multiple-choice': 'בחירה מרובה'
  };
  return typeLabels[type] || type;
}

function getQuestionMeta(question) {
  const metaItems = [];
  
  if (question.topic) {
    metaItems.push(`
      <div class="question-meta-item">
        <span class="question-meta-label">נושא:</span>
        <span>${question.topic}</span>
      </div>
    `);
  }
  
  if (question.required) {
    metaItems.push(`
      <div class="question-meta-item">
        <span class="question-meta-label">חובה:</span>
        <span>כן</span>
      </div>
    `);
  }
  
  return metaItems.join('');
}

function loadSummaryInfo(reviewData) {
  document.getElementById('managerSummary').textContent = reviewData.managerSummary || '';
  document.getElementById('keyStrengths').textContent = reviewData.keyStrengths || '';
  document.getElementById('areasForImprovement').textContent = reviewData.areasForImprovement || '';
}

function calculateTotalScore(reviewData) {
  const questions = reviewData.questions || [];
  const answers = reviewData.answers || {};
  
  let totalScore = 0;
  let scoredQuestions = 0;
  
  questions.forEach((question, index) => {
    if (question.type === 'score') {
      const score = answers[question.id] || answers[index] || 0;
      if (score > 0) {
        totalScore += score;
        scoredQuestions++;
      }
    }
  });
  
  return scoredQuestions > 0 ? totalScore / scoredQuestions : 0;
}

// Action Functions
function editReview() {
  const reviewIndex = localStorage.getItem('currentReviewIndex');
  if (reviewIndex !== null) {
    // Redirect to edit page (you'll need to create this)
    window.location.href = `review-edit.html?index=${reviewIndex}`;
  } else {
    alert('לא ניתן לערוך ביקורת זו');
  }
}

function printReview() {
  // Hide action buttons for print
  const headerActions = document.querySelector('.header-actions');
  const backLink = document.querySelector('.back-link');
  
  if (headerActions) headerActions.style.display = 'none';
  if (backLink) backLink.style.display = 'none';
  
  // Print the page
  window.print();
  
  // Restore action buttons
  setTimeout(() => {
    if (headerActions) headerActions.style.display = 'flex';
    if (backLink) backLink.style.display = 'inline-flex';
  }, 1000);
}

function saveAsPDF() {
  // For now, we'll use the browser's print to PDF functionality
  // In a real implementation, you might want to use a library like jsPDF
  alert('פונקציונליות שמירה כקובץ PDF תתווסף בקרוב. בינתיים, השתמש בפונקציית ההדפסה.');
  printReview();
}

function showError(message) {
  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">שגיאה</h2>
      <p class="error-message">${message}</p>
      <a href="reviews.html" class="btn btn-primary">חזרה לרשימת ביקורות</a>
    </div>
  `;
}

// Add CSS for error state
const errorStyles = `
  .error-container {
    text-align: center;
    padding: 60px 20px;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  .error-title {
    font-size: 24px;
    font-weight: 700;
    color: #1d1d1f;
    margin: 0 0 16px 0;
  }
  
  .error-message {
    font-size: 16px;
    color: #6b7280;
    margin: 0 0 32px 0;
    line-height: 1.5;
  }
  
  .no-questions {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 40px 20px;
  }
`;

// Inject error styles
const styleSheet = document.createElement("style");
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet); 