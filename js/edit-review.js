// Rebuilt edit-review.js from review-view.js, but with editable Q&A section
window.addEventListener('DOMContentLoaded', function() {
  // Load review data
  const review = JSON.parse(localStorage.getItem('currentReview') || '{}');
  const reviewIndex = localStorage.getItem('currentReviewIndex');
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');

  // --- Populate branch info ---
  const branch = branches.find(b => b.name === review.branch) || {};
  document.getElementById('branchName').textContent = branch.name || review.branch || '';
  document.getElementById('branchAddress').textContent = branch.address || '';
  document.getElementById('managerName').textContent = branch.managerName || branch.manager || '';
  document.getElementById('managerPhone').textContent = branch.managerPhone || branch.contact || '';
  document.getElementById('franchiseeName').textContent = branch.franchisee || branch.franchiseeName || '-';
  document.getElementById('kashrutType').textContent = branch.kashrutType || '-';
  document.getElementById('businessType').textContent = branch.businessType || '-';
  document.getElementById('branchStatus').textContent = branch.status || '-';

  // --- Populate meta fields ---
  const branchSelect = document.getElementById('branchSelect');
  branchSelect.innerHTML = '';
  branches.forEach(b => {
    const option = document.createElement('option');
    option.value = b.name;
    option.textContent = b.name + (b.city ? ' - ' + b.city : '');
    if (b.name === review.branch) option.selected = true;
    branchSelect.appendChild(option);
  });
  const typeSelect = document.getElementById('reviewTypeSelect');
  typeSelect.innerHTML = '';
  surveys.forEach(s => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = s.name;
    if (s.name === review.type) option.selected = true;
    typeSelect.appendChild(option);
  });
  document.getElementById('reviewerName').value = review.reviewer || '';
  document.getElementById('reviewDate').value = review.date || '';

  // --- Populate summary fields ---
  document.getElementById('managerSummary').value = review.managerSummary || '';
  document.getElementById('keyStrengths').value = review.keyStrengths || '';
  document.getElementById('areasForImprovement').value = review.areasForImprovement || '';

  // --- Render editable Q&A section ---
  function renderQuestions() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    let survey = surveys.find(s => s.name === review.type);
    let questions = (survey && Array.isArray(survey.questions) && survey.questions.length > 0)
      ? survey.questions : (review.questions && review.questions.length > 0 ? review.questions : []);
    console.log('Loaded review:', review);
    console.log('Review answers:', review.questions);
    console.log('Selected survey:', survey);
    console.log('Survey questions:', survey ? survey.questions : undefined);
    if (!questions.length) {
      questionsContainer.innerHTML = '<div style="color:#b91c1c;font-size:18px;padding:32px;text-align:center;">לא נמצאו שאלות עבור סוג ביקורת זה.<br>ודא שקיים שאלון מתאים במערכת.</div>';
      return;
    }
    questions.forEach((question, index) => {
      // Find answer by questionId, questionText, or itemName
      let answer = (review.questions || []).find(a =>
        (a.questionId && question.questionId && a.questionId === question.questionId) ||
        (a.questionText && question.questionText && a.questionText === question.questionText) ||
        (a.itemName && question.itemName && a.itemName === question.itemName)
      ) || {};
      let qDiv = document.createElement('div');
      qDiv.className = 'question-item';
      let questionTitle = question.questionText || question.text || '';
      let metaHtml = '';
      if (question.topic) metaHtml += `<span class='question-meta-label'>נושא:</span> <span>${question.topic}</span>`;
      if (question.required) metaHtml += `<span class='question-meta-label' style='margin-right:16px;'>חובה:</span> <span>כן</span>`;
      let html = `<div class='question-header'><h3 class='question-title'>${questionTitle}</h3></div><div class='question-content'>`;
      if (metaHtml) html += `<div class='question-meta' style='margin-bottom:8px;'>${metaHtml}</div>`;
      // Editable answer input
      if ((question.itemType || question.type) === 'free-text') {
        html += `<div class='question-row-flex'><div class='score-btn-row'>${[1,2,3,4,5].map(num => `<span class='score-btn${answer.score == num ? ' selected' : ''}' data-q='${questionTitle}' data-score='${num}'>${num}</span>`).join('')}</div></div>`;
      } else if ((question.itemType || question.type) === 'rating-1-5') {
        html += `<div class='question-row-flex'><div class='score-btn-row'>${[1,2,3,4,5].map(num => `<span class='score-btn${answer.score == num ? ' selected' : ''}' data-q='${questionTitle}' data-score='${num}'>${num}</span>`).join('')}</div></div>`;
      } else if ((question.itemType || question.type) === 'status-ok') {
        html += `<div class='question-row-flex'><div class='status-selector'>`;
        html += `<span class='score-btn${answer.score == 5 ? ' selected' : ''}' data-q='${questionTitle}' data-score='5'>✅ תקין</span>`;
        html += `<span class='score-btn${answer.score == 3 ? ' selected' : ''}' data-q='${questionTitle}' data-score='3'>⚠️ חלקי</span>`;
        html += `<span class='score-btn${answer.score == 1 ? ' selected' : ''}' data-q='${questionTitle}' data-score='1'>❌ לא תקין</span>`;
        html += `</div></div>`;
      }
      html += `</div>`;
      qDiv.innerHTML = html;
      questionsContainer.appendChild(qDiv);
    });
    // Add event listeners for score selection
    questionsContainer.querySelectorAll('.score-btn').forEach(btn => {
      btn.onclick = function() {
        const qKey = this.getAttribute('data-q');
        const score = parseInt(this.getAttribute('data-score'));
        // Remove selected from siblings
        this.parentElement.querySelectorAll('.score-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        // Update answer in review.questions by identifier
        let qObj = (review.questions || []).find(a =>
          (a.questionText && a.questionText === qKey) ||
          (a.itemName && a.itemName === qKey) ||
          (a.text && a.text === qKey)
        );
        if (!qObj) {
          qObj = { itemName: qKey };
          if (!review.questions) review.questions = [];
          review.questions.push(qObj);
        }
        qObj.score = score;
        if ((questions.find(q => (q.itemName || q.questionText || q.text) === qKey)?.itemType || questions.find(q => (q.itemName || q.questionText || q.text) === qKey)?.type) === 'rating-1-5') {
          qObj.answer = score;
        }
      };
    });
    // Add event listeners for textarea changes
    questionsContainer.querySelectorAll('textarea.edit-free-text').forEach(textarea => {
      textarea.oninput = function() {
        const qKey = this.getAttribute('data-q');
        let qObj = (review.questions || []).find(a =>
          (a.questionText && a.questionText === qKey) ||
          (a.itemName && a.itemName === qKey) ||
          (a.text && a.text === qKey)
        );
        if (!qObj) {
          qObj = { itemName: qKey };
          if (!review.questions) review.questions = [];
          review.questions.push(qObj);
        }
        qObj.answer = this.value;
      };
    });
  }

  // Initial render
  renderQuestions();
  typeSelect.addEventListener('change', renderQuestions);

  // --- Save logic ---
  document.getElementById('saveEditReviewBtn').onclick = function() {
    // Validate required fields
    if (!branchSelect.value || !typeSelect.value || !document.getElementById('reviewerName').value.trim() || !document.getElementById('reviewDate').value) {
      showMinimalAlert('נא למלא את כל השדות החיוניים', false);
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
    // Recalculate scores
    let totalScore = 0, answeredQuestions = 0;
    (review.questions || []).forEach((q, idx) => {
      if (typeof q.score === 'number' && q.score > 0) {
        totalScore += q.score;
        answeredQuestions++;
      }
    });
    review.totalScore = totalScore;
    review.answeredQuestions = answeredQuestions;
    review.averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    review.totalQuestions = (surveys.find(s => s.name === review.type)?.questions?.length) || (review.questions?.length) || 0;
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
    showMinimalAlert('הביקורת עודכנה בהצלחה!', true, function() {
      window.location.href = 'reviews.html';
    });
  };

  // --- Minimal Apple-style alert ---
  function showMinimalAlert(msg, success, cb) {
    let alertDiv = document.createElement('div');
    alertDiv.textContent = msg;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '32px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.background = success ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : '#fff1f2';
    alertDiv.style.color = success ? '#1d1d1f' : '#b91c1c';
    alertDiv.style.padding = '16px 32px';
    alertDiv.style.fontSize = '18px';
    alertDiv.style.borderRadius = '12px';
    alertDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
    alertDiv.style.zIndex = 9999;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = 0;
      setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
        if (cb) cb();
      }, 400);
    }, 1800);
  }
}); 