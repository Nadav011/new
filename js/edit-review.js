// Edit Review Page Logic
window.addEventListener('DOMContentLoaded', function() {
  // Load review to edit
  let review = JSON.parse(localStorage.getItem('currentReview') || '{}');
  let reviewIndex = localStorage.getItem('currentReviewIndex');
  if (!review || Object.keys(review).length === 0) {
    alert('לא נמצאה ביקורת לעריכה');
    window.location.href = 'reviews.html';
    return;
  }
  if (!Array.isArray(review.questions)) review.questions = [];

  // Load branches and surveys
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');

  // Fill branch select
  const branchSelect = document.getElementById('branchSelect');
  branches.forEach(branch => {
    const option = document.createElement('option');
    option.value = branch.name;
    option.textContent = branch.name + (branch.city ? ' - ' + branch.city : '');
    branchSelect.appendChild(option);
  });
  branchSelect.value = review.branch;

  // Fill review type select
  const typeSelect = document.getElementById('reviewTypeSelect');
  surveys.forEach(s => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = s.name;
    typeSelect.appendChild(option);
  });
  typeSelect.value = review.type;

  // Fill other fields
  document.getElementById('reviewerName').value = review.reviewer || '';
  document.getElementById('reviewDate').value = review.date || '';
  document.getElementById('managerSummary').value = review.managerSummary || '';
  document.getElementById('keyStrengths').value = review.keyStrengths || '';
  document.getElementById('areasForImprovement').value = review.areasForImprovement || '';

  // --- Robustly match answers to questions ---
  function findAnswerForQuestion(question, idx) {
    // Try by index, then by questionText/itemName
    let answer = review.questions[idx];
    if (!answer && question.questionText) {
      answer = review.questions.find(q => q.questionText === question.questionText);
    }
    if (!answer && question.itemName) {
      answer = review.questions.find(q => q.itemName === question.itemName);
    }
    return answer || {};
  }

  // --- Render questions for editing ---
  function renderQuestions() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    const selectedSurvey = surveys.find(s => s.name === typeSelect.value);
    if (!selectedSurvey || !selectedSurvey.questions) return;
    selectedSurvey.questions.forEach((question, index) => {
      let answer = findAnswerForQuestion(question, index);
      let qDiv = document.createElement('div');
      qDiv.className = 'question-item';
      let html = `<div class='question-header'><h3 class='question-title'>${question.questionText || question.itemName || ''}</h3></div><div class='question-content'>`;
      if (question.itemType === 'free-text') {
        html += `<textarea class='edit-free-text' data-q='${index}' rows='3' style='width:100%;margin-bottom:10px;'>${answer.answer || ''}</textarea>`;
        html += `<div class='score-btn-row'>${[1,2,3,4,5].map(num => `<span class='score-btn${answer.score == num ? ' selected' : ''}' data-q='${index}' data-score='${num}'>${num}</span>`).join('')}</div>`;
      } else if (question.itemType === 'rating-1-5') {
        html += `<div class='score-btn-row'>${[1,2,3,4,5].map(num => `<span class='score-btn${answer.score == num ? ' selected' : ''}' data-q='${index}' data-score='${num}'>${num}</span>`).join('')}</div>`;
      } else if (question.itemType === 'status-ok') {
        html += `<div class='score-btn-row'>`;
        html += `<span class='score-btn${answer.score == 5 ? ' selected' : ''}' data-q='${index}' data-score='5'> 197 תקין</span>`;
        html += `<span class='score-btn${answer.score == 3 ? ' selected' : ''}' data-q='${index}' data-score='3'> 6a7 חלקי</span>`;
        html += `<span class='score-btn${answer.score == 1 ? ' selected' : ''}' data-q='${index}' data-score='1'> 274c לא תקין</span>`;
        html += `</div>`;
      }
      html += `</div>`;
      qDiv.innerHTML = html;
      questionsContainer.appendChild(qDiv);
    });
    // Add event listeners for score selection
    questionsContainer.querySelectorAll('.score-btn').forEach(btn => {
      btn.onclick = function() {
        const qIdx = parseInt(this.getAttribute('data-q'));
        const score = parseInt(this.getAttribute('data-score'));
        // Remove selected from siblings
        this.parentElement.querySelectorAll('.score-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        // Update answer in review object
        if (!review.questions[qIdx]) review.questions[qIdx] = {};
        review.questions[qIdx].score = score;
        if (selectedSurvey.questions[qIdx].itemType === 'rating-1-5') {
          review.questions[qIdx].answer = score;
        }
      };
    });
  }

  // Render questions initially
  renderQuestions();

  // Update questions if review type changes
  typeSelect.addEventListener('change', function() {
    renderQuestions();
  });

  // Save logic
  document.getElementById('saveEditReviewBtn').onclick = function() {
    // Validate required fields
    if (!branchSelect.value || !typeSelect.value || !document.getElementById('reviewerName').value.trim() || !document.getElementById('reviewDate').value) {
      alert('נא למלא את כל השדות החיוניים');
      return;
    }
    // Update review object
    review.branch = branchSelect.value;
    review.type = typeSelect.value;
    review.reviewer = document.getElementById('reviewerName').value;
    review.date = document.getElementById('reviewDate').value;
    review.managerSummary = document.getElementById('managerSummary').value;
    review.keyStrengths = document.getElementById('keyStrengths').value;
    review.areasForImprovement = document.getElementById('areasForImprovement').value;
    // Update answers for free-text
    const selectedSurvey = surveys.find(s => s.name === typeSelect.value);
    if (selectedSurvey && selectedSurvey.questions) {
      selectedSurvey.questions.forEach((question, index) => {
        if (question.itemType === 'free-text') {
          const textarea = document.querySelector(`textarea.edit-free-text[data-q='${index}']`);
          if (!review.questions[index]) review.questions[index] = {};
          review.questions[index].answer = textarea.value;
        }
      });
    }
    // Recalculate scores
    let totalScore = 0, answeredQuestions = 0;
    review.questions.forEach((q, idx) => {
      if (typeof q.score === 'number' && q.score > 0) {
        totalScore += q.score;
        answeredQuestions++;
      }
    });
    review.totalScore = totalScore;
    review.answeredQuestions = answeredQuestions;
    review.averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    review.totalQuestions = selectedSurvey && selectedSurvey.questions ? selectedSurvey.questions.length : 0;
    // Save back to reviews array
    let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    if (reviewIndex !== null && reviews[reviewIndex]) {
      reviews[reviewIndex] = review;
    } else {
      // fallback: update by branch+date+reviewer
      const idx = reviews.findIndex(r => r.branch === review.branch && r.date === review.date && r.reviewer === review.reviewer);
      if (idx !== -1) reviews[idx] = review;
    }
    localStorage.setItem('reviews', JSON.stringify(reviews));
    localStorage.setItem('currentReview', JSON.stringify(review));
    localStorage.setItem('currentReviewIndex', reviewIndex);
    alert('הביקורת עודכנה בהצלחה!');
    window.location.href = 'review-view.html';
  };
}); 