document.addEventListener("DOMContentLoaded", function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("reviewDate").value = today;

  const branches = JSON.parse(localStorage.getItem("branches")) || [];
  const branchSelect = document.getElementById("branchSelect");
  branches.forEach(branch => {
    const option = document.createElement("option");
    option.textContent = branch.name + " - " + branch.city;
    option.value = branch.name;
    branchSelect.appendChild(option);
  });

  // טען סוגי ביקורת מהסקרים (surveys)
  const typeSelect = document.getElementById("reviewTypeSelect");
  const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
  surveys.forEach(s => {
    const option = document.createElement("option");
    option.textContent = s.name;
    option.value = s.name;
    typeSelect.appendChild(option);
  });

  // Elements
  const reviewCard = document.querySelector(".review-card");
  const reviewTypeHeader = document.getElementById("reviewTypeHeader");
  const questionsContainer = document.getElementById("questionsContainer");
  const noQuestionsBox = document.getElementById("noQuestionsBox");
  const defineBtn = document.getElementById("defineQuestionsBtn");
  const managerSummarySection = document.querySelector(".text-areas-section");

  // Hide all dynamic sections initially
  reviewCard.style.display = "none";
  questionsContainer.style.display = "none";
  noQuestionsBox.style.display = "none";
  managerSummarySection.style.display = "none";

  // Function to check if both selects are filled and show/hide the card
  function checkSelections() {
    const branchValue = branchSelect.value;
    const typeValue = typeSelect.value;
    if (branchValue && typeValue && branchValue !== "בחר סניף..." && typeValue !== "בחר סוג ביקורת...") {
      reviewCard.style.display = "block";
      loadReviewTypeData(typeValue);
    } else {
      reviewCard.style.display = "none";
      questionsContainer.style.display = "none";
      noQuestionsBox.style.display = "none";
      managerSummarySection.style.display = "none";
    }
  }

  // Function to load review type data and questions
  function loadReviewTypeData(reviewTypeName) {
    reviewTypeHeader.textContent = reviewTypeName;
    questionsContainer.innerHTML = "";
    questionsContainer.style.display = "none";
    noQuestionsBox.style.display = "none";
    managerSummarySection.style.display = "none";

    // Load questions from the selected survey
    const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
    const selectedSurvey = surveys.find(s => s.name === reviewTypeName);
    
    if (selectedSurvey && selectedSurvey.questions && selectedSurvey.questions.length > 0) {
      // Display questions with scoring
      renderQuestionsForReview(selectedSurvey.questions);
      questionsContainer.style.display = "block";
      noQuestionsBox.style.display = "none";
    } else {
      // Show 'No questions defined' message and button
      questionsContainer.style.display = "none";
      noQuestionsBox.style.display = "flex";
    }
    // Always show manager summary section after selection
    managerSummarySection.style.display = "grid";
  }
  
  // Function to render questions for review
  function renderQuestionsForReview(questions) {
    const questionsHTML = questions.map((question, index) => {
      if (question.itemType === 'group-title') {
        return `
          <div class="question-group-title" style="
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin: 16px 0 8px 0;
            font-weight: 700;
            font-size: 18px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
          ">
            ${question.itemName}
          </div>
        `;
      } else {
        let answerInput = '';
        
        if (question.itemType === 'free-text') {
          answerInput = `
            <textarea 
              class="question-answer" 
              data-question-index="${index}"
              placeholder="הכנס תשובה..."
              rows="3"
              style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-family: inherit;
                resize: vertical;
              "
            ></textarea>
          `;
        } else if (question.itemType === 'rating-1-5') {
          answerInput = `
            <div class="rating-input" data-question-index="${index}">
              ${[1, 2, 3, 4, 5].map(num => `
                <label style="display: inline-block; margin: 0 8px;">
                  <input type="radio" name="rating_${index}" value="${num}" style="display: none;">
                  <span class="rating-option" style="
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                    border: 2px solid #d1d5db;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 36px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                  ">${num}</span>
                </label>
              `).join('')}
            </div>
          `;
        } else if (question.itemType === 'status-ok') {
          answerInput = `
            <div class="status-input" data-question-index="${index}">
              ${['תקין', 'חלקי', 'לא תקין'].map(status => `
                <label style="display: inline-block; margin: 0 8px;">
                  <input type="radio" name="status_${index}" value="${status}" style="display: none;">
                  <span class="status-option" style="
                    display: inline-block;
                    padding: 8px 16px;
                    border: 2px solid #d1d5db;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                  ">${status}</span>
                </label>
              `).join('')}
            </div>
          `;
        }
        
        return `
          <div class="question-item" style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin: 12px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          ">
            <div class="question-header" style="margin-bottom: 16px;">
              <h3 class="question-text" style="
                font-size: 16px;
                font-weight: 600;
                color: #1d1d1f;
                margin: 0 0 8px 0;
              ">${question.questionText}</h3>
              <div class="question-meta" style="
                display: flex;
                gap: 16px;
                font-size: 13px;
                color: #6b7280;
              ">
                <span><strong>נושא:</strong> ${question.topic}</span>
                <span><strong>ציון מקסימלי:</strong> ${question.score}/10</span>
              </div>
            </div>
            <div class="question-answer-section">
              ${answerInput}
            </div>
          </div>
        `;
      }
    }).join('');
    
    questionsContainer.innerHTML = questionsHTML;
    
    // Add event listeners for rating and status inputs
    setTimeout(() => {
      addQuestionInputListeners();
    }, 100);
  }
  
  // Function to add event listeners for question inputs
  function addQuestionInputListeners() {
    // Rating inputs
    document.querySelectorAll('.rating-input input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        const ratingOptions = this.parentElement.parentElement.querySelectorAll('.rating-option');
        ratingOptions.forEach(option => {
          option.style.backgroundColor = '';
          option.style.color = '';
          option.style.borderColor = '#d1d5db';
        });
        
        const selectedOption = this.parentElement.querySelector('.rating-option');
        selectedOption.style.backgroundColor = '#1976d2';
        selectedOption.style.color = 'white';
        selectedOption.style.borderColor = '#1976d2';
      });
    });
    
    // Status inputs
    document.querySelectorAll('.status-input input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        const statusOptions = this.parentElement.parentElement.querySelectorAll('.status-option');
        statusOptions.forEach(option => {
          option.style.backgroundColor = '';
          option.style.color = '';
          option.style.borderColor = '#d1d5db';
        });
        
        const selectedOption = this.parentElement.querySelector('.status-option');
        selectedOption.style.backgroundColor = '#1976d2';
        selectedOption.style.color = 'white';
        selectedOption.style.borderColor = '#1976d2';
      });
    });
  }

  // Add event listeners for select changes
  branchSelect.addEventListener("change", checkSelections);
  typeSelect.addEventListener("change", checkSelections);

  // Handle 'Go to define questions' button
  defineBtn.addEventListener("click", function() {
    // Navigate to Survey Management page
    window.location.href = "survey-management.html";
  });

  // Handle save button (now at the bottom)
  document.getElementById("saveReviewBtn").addEventListener("click", function() {
    const reviewerInput = document.getElementById("reviewerName");
    const branchValue = branchSelect.value;
    const typeValue = typeSelect.value;
    const dateInput = document.getElementById("reviewDate");
    let missing = [];
    // Branch
    if (!branchValue || branchValue === "בחר סניף...") {
      missing.push("סניף");
      branchSelect.style.border = "2px solid #e53935";
      setTimeout(() => { branchSelect.style.border = ""; }, 1500);
    }
    // Review Type
    if (!typeValue || typeValue === "בחר סוג ביקורת...") {
      missing.push("סוג ביקורת");
      typeSelect.style.border = "2px solid #e53935";
      setTimeout(() => { typeSelect.style.border = ""; }, 1500);
    }
    // Reviewer Name
    if (!reviewerInput.value.trim()) {
      missing.push("שם המבקר");
      reviewerInput.style.border = "2px solid #e53935";
      setTimeout(() => { reviewerInput.style.border = ""; }, 1500);
    }
    // Date
    if (!dateInput.value) {
      missing.push("תאריך ביקורת");
      dateInput.style.border = "2px solid #e53935";
      setTimeout(() => { dateInput.style.border = ""; }, 1500);
    }
    if (missing.length > 0) {
      alert("יש למלא את השדות הבאים:\n" + missing.join(", "));
      if (missing.includes("סניף")) branchSelect.focus();
      else if (missing.includes("סוג ביקורת")) typeSelect.focus();
      else if (missing.includes("שם המבקר")) reviewerInput.focus();
      else if (missing.includes("תאריך ביקורת")) dateInput.focus();
      return;
    }
    
    // Collect question answers and calculate scores
    const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
    const selectedSurvey = surveys.find(s => s.name === typeValue);
    const questions = selectedSurvey ? selectedSurvey.questions || [] : [];
    const questionAnswers = [];
    let totalScore = 0;
    let answeredQuestions = 0;
    
    questions.forEach((question, index) => {
      if (question.itemType === 'group-title') {
        questionAnswers.push({
          questionIndex: index,
          itemName: question.itemName,
          itemType: question.itemType,
          answer: null,
          score: 0
        });
      } else {
        let answer = null;
        let score = 0;
        
        if (question.itemType === 'free-text') {
          const textarea = document.querySelector(`textarea[data-question-index="${index}"]`);
          answer = textarea ? textarea.value : '';
          score = answer.trim() ? parseInt(question.score) : 0;
        } else if (question.itemType === 'rating-1-5') {
          const selectedRating = document.querySelector(`input[name="rating_${index}"]:checked`);
          if (selectedRating) {
            const ratingValue = parseInt(selectedRating.value);
            answer = ratingValue;
            // Convert 1-5 rating to 1-10 scale
            score = Math.round((ratingValue / 5) * parseInt(question.score));
          }
        } else if (question.itemType === 'status-ok') {
          const selectedStatus = document.querySelector(`input[name="status_${index}"]:checked`);
          if (selectedStatus) {
            answer = selectedStatus.value;
            // Convert status to score: תקין = full score, חלקי = half score, לא תקין = 0
            const maxScore = parseInt(question.score);
            if (answer === 'תקין') score = maxScore;
            else if (answer === 'חלקי') score = Math.round(maxScore / 2);
            else score = 0;
          }
        }
        
        questionAnswers.push({
          questionIndex: index,
          itemName: question.itemName,
          itemType: question.itemType,
          questionText: question.questionText,
          topic: question.topic,
          maxScore: parseInt(question.score),
          answer: answer,
          score: score
        });
        
        if (answer !== null) {
          totalScore += score;
          answeredQuestions++;
        }
      }
    });
    
    const averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const newReview = {
      branch: branchSelect.value,
      type: typeSelect.value,
      reviewer: reviewerInput.value,
      date: dateInput.value,
      managerSummary: document.getElementById("managerSummary").value,
      keyStrengths: document.getElementById("keyStrengths").value,
      areasForImprovement: document.getElementById("areasForImprovement").value,
      questions: questionAnswers,
      totalScore: totalScore,
      averageScore: averageScore,
      answeredQuestions: answeredQuestions,
      totalQuestions: questions.filter(q => q.itemType !== 'group-title').length
    };
    reviews.push(newReview);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    alert("הביקורת נוספה בהצלחה!");
    window.location.href = "reviews.html";
  });
});
