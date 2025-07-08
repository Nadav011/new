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
  scoreElement.textContent = `${totalScore.toFixed(2)}/5`;
  
  // Color code the score
  if (totalScore >= 4.5) {
    scoreElement.style.color = '#10b981';
  } else if (totalScore >= 3) {
    scoreElement.style.color = '#f59e0b';
  } else {
    scoreElement.style.color = '#ef4444';
  }
}

function loadQuestionsAndAnswers(reviewData) {
  const questionsContainer = document.getElementById('questionsContainer');
  questionsContainer.innerHTML = '';
  const questions = reviewData.questions || [];
  if (questions.length === 0) {
    questionsContainer.innerHTML = '<p class="no-questions">לא נמצאו שאלות לביקורת זו</p>';
    return;
  }
  questions.forEach((question, index) => {
    // Use the review.questions array for answers
    const answerObj = reviewData.questions[index] || {};
    const type = question.itemType || question.type;
    let answerContent = '';
    if (type === 'free-text') {
      answerContent = `
        <div class="question-answer">
          <div class="free-text-answer" style="background:#f7f8fa;border-radius:10px;padding:14px 18px;margin-bottom:10px;color:#222;font-size:16px;min-height:38px;">${answerObj.answer ? answerObj.answer : '<span style=\'color:#aaa\'>לא נכתבה תשובה</span>'}</div>
          <div class="score-btn-row" style="margin-top: 12px;">
            ${[1,2,3,4,5].map(num => `<span class="score-btn${answerObj.score == num ? ' selected' : ''}">${num}${answerObj.score == num ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (type === 'rating-1-5') {
      answerContent = `
        <div class="question-answer">
          <div class="score-btn-row" style="margin-top: 12px;">
            ${[1,2,3,4,5].map(num => `<span class="score-btn${answerObj.score == num ? ' selected' : ''}">${num}${answerObj.score == num ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (type === 'status-ok') {
      answerContent = `
        <div class="question-answer">
          <div class="status-selector" style="margin-top: 12px;">
            <span class="score-btn${answerObj.score == 5 ? ' selected' : ''}">✅ תקין${answerObj.score == 5 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
            <span class="score-btn${answerObj.score == 3 ? ' selected' : ''}">⚠️ חלקי${answerObj.score == 3 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
            <span class="score-btn${answerObj.score == 1 ? ' selected' : ''}">❌ לא תקין${answerObj.score == 1 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
          </div>
        </div>
      `;
    }
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
      <div class="question-header">
        <h3 class="question-title">${question.itemName || question.questionText || question.text}</h3>
      </div>
      <div class="question-content">
        <div class="question-meta">${question.topic ? `<span class="question-meta-label">נושא:</span> <span>${question.topic}</span>` : ''}</div>
        ${answerContent}
      </div>
    `;
    questionsContainer.appendChild(questionDiv);
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

  // Map legacy and new types
  let type = question.itemType || question.type;
  if (type === 'free-text') type = 'free-text';
  else if (type === 'rating-1-5') type = 'rating-1-5';
  else if (type === 'status-ok') type = 'status-ok';

  let answerContent = '';

  if (type === 'free-text') {
    answerContent = `
      <div class="question-answer">
        <div class="free-text-answer" style="background:#f7f8fa;border-radius:10px;padding:14px 18px;margin-bottom:10px;color:#222;font-size:16px;min-height:38px;">${answer && answer.text ? answer.text : '<span style=\'color:#aaa\'>לא נכתבה תשובה</span>'}</div>
        <div class="score-btn-row" style="margin-top: 12px;">
          ${[1,2,3,4,5].map(num => `<span class="score-btn${answer && answer.score == num ? ' selected' : ''}">${num}${answer && answer.score == num ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>`).join('')}
        </div>
      </div>
    `;
  } else if (type === 'rating-1-5') {
    answerContent = `
      <div class="question-answer">
        <div class="score-btn-row" style="margin-top: 12px;">
          ${[1,2,3,4,5].map(num => `<span class="score-btn${answer == num ? ' selected' : ''}">${num}${answer == num ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>`).join('')}
        </div>
      </div>
    `;
  } else if (type === 'status-ok') {
    answerContent = `
      <div class="question-answer">
        <div class="status-selector" style="margin-top: 12px;">
          <span class="score-btn${answer == 5 ? ' selected' : ''}">✅ תקין${answer == 5 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
          <span class="score-btn${answer == 3 ? ' selected' : ''}">⚠️ חלקי${answer == 3 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
          <span class="score-btn${answer == 1 ? ' selected' : ''}">❌ לא תקין${answer == 1 ? ' <span style=\'font-size:18px;vertical-align:middle;\'>✔</span>' : ''}</span>
        </div>
      </div>
    `;
  }

  questionDiv.innerHTML = `
    <div class="question-header">
      <h3 class="question-title">${question.itemName || question.text}</h3>
    </div>
    <div class="question-content">
      <div class="question-meta">${question.topic ? `<span class="question-meta-label">נושא:</span> <span>${question.topic}</span>` : ''}</div>
      ${answerContent}
    </div>
  `;

  return questionDiv;
}

function getQuestionTypeLabel(type) {
  const typeLabels = {
    'free-text': 'תשובה חופשית',
    'rating-1-5': 'דירוג 1-5',
    'status-ok': 'תקין/חלקי/לא תקין'
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
  let totalScore = 0;
  let scoredQuestions = 0;
  questions.forEach((q) => {
    if (typeof q.score === 'number' && q.score > 0) {
      totalScore += q.score;
      scoredQuestions++;
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