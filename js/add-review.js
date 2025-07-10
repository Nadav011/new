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
      questionsContainer.style.display = "none";
      noQuestionsBox.style.display = "flex";
      // Set up the create questions button to redirect with the correct review type
      const createBtn = document.getElementById('createQuestionsBtn');
      if (createBtn) {
        createBtn.onclick = function() {
          window.location.href = `questions-setup.html?survey=${encodeURIComponent(reviewTypeName)}`;
        };
      }
    }
    // Always show manager summary section after selection
    managerSummarySection.style.display = "grid";
  }
  
  // Function to render questions for review
  function renderQuestionsForReview(questions) {
    // Group questions by topic/category
    const grouped = {};
    questions.forEach((q, i) => {
      const topic = q.topic || 'ללא נושא';
      if (!grouped[topic]) grouped[topic] = [];
      grouped[topic].push({ ...q, _index: i });
    });
    // Build HTML by topic, with numbering (up to 9 questions per topic)
    let topicIndex = 1;
    let questionsHTML = Object.entries(grouped).map(([topic, qs]) => {
      const currentTopicNumber = topicIndex;
      topicIndex++;
      return `
        <div class="review-topic-group">
          <div class="review-topic-header modern-topic-header">
            <span class='topic-number'>${currentTopicNumber}</span><span class="topic-name">${topic}</span>
          </div>
          <div class="review-topic-questions">
            ${qs.map((question, qIdx) => {
              let answerInput = '';
              let qNum = `${currentTopicNumber}.${qIdx + 1}`;
              if (question.itemType === 'free-text') {
                answerInput = `
                  <textarea 
                    class="question-answer" 
                    data-question-index="${question._index}"
                    placeholder="הכנס תשובה..."
                    rows="3"
                    style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; resize: vertical;"
                  ></textarea>
                  <div class="rating-input" data-question-index="${question._index}" style="margin-top: 10px; text-align: center;">
                    ${[1, 2, 3, 4, 5].map(num => `
                      <label style="display: inline-block; margin: 0 8px;">
                        <input type="radio" name="rating_${question._index}" value="${num}" style="display: none;">
                        <span class="rating-option" style="display: inline-block; width: 40px; height: 40px; border: 2px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 36px; cursor: pointer; transition: all 0.2s ease; font-weight: bold;">${num}</span>
                      </label>
                    `).join('')}
                  </div>
                `;
              } else if (question.itemType === 'rating-1-5') {
                answerInput = `
                  <div class="rating-input" data-question-index="${question._index}" style="text-align: center;">
                    ${[1, 2, 3, 4, 5].map(num => `
                      <label style="display: inline-block; margin: 0 8px;">
                        <input type="radio" name="rating_${question._index}" value="${num}" style="display: none;">
                        <span class="rating-option" style="display: inline-block; width: 40px; height: 40px; border: 2px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 36px; cursor: pointer; transition: all 0.2s ease; font-weight: bold;">${num}</span>
                      </label>
                    `).join('')}
                  </div>
                `;
              } else if (question.itemType === 'status-ok') {
                answerInput = `
                  <div class="status-input" data-question-index="${question._index}" style="text-align: center;">
                    <label style="display: inline-block; margin: 0 8px;">
                      <input type="radio" name="status_${question._index}" value="תקין" style="display: none;">
                      <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">✅ תקין</span>
                    </label>
                    <label style="display: inline-block; margin: 0 8px;">
                      <input type="radio" name="status_${question._index}" value="חלקי" style="display: none;">
                      <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">⚠️ חלקי</span>
                    </label>
                    <label style="display: inline-block; margin: 0 8px;">
                      <input type="radio" name="status_${question._index}" value="לא תקין" style="display: none;">
                      <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">❌ לא תקין</span>
                    </label>
                  </div>
                `;
              }
              return `
                <div class="question-item">
                  <div class="question-header">
                    <span class='question-number'>${qNum}</span>
                    <h3 class="question-text">${question.questionText}</h3>
                  </div>
                  <div class="question-topic-under">
                    ${question.subtopic ? `<span class='question-subtopic'>${question.subtopic}</span>` : ''} ${topic}
                  </div>
                  <div class="question-answer-section">
                    ${(() => {
                      if (question.itemType === 'free-text') {
                        return `
                          <textarea 
                            class="question-answer" 
                            data-question-index="${question._index}"
                            placeholder="הכנס תשובה..."
                            rows="3"
                            style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; resize: vertical;"
                          ></textarea>
                          <div class="rating-input" data-question-index="${question._index}" style="margin-top: 10px; text-align: center;">
                            ${[1, 2, 3, 4, 5].map(num => `
                              <label style="display: inline-block; margin: 0 8px;">
                                <input type="radio" name="rating_${question._index}" value="${num}" style="display: none;">
                                <span class="rating-option" style="display: inline-block; width: 40px; height: 40px; border: 2px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 36px; cursor: pointer; transition: all 0.2s ease; font-weight: bold;">${num}</span>
                              </label>
                            `).join('')}
                          </div>
                        `;
                      } else if (question.itemType === 'rating-1-5') {
                        return `
                          <div class="rating-input" data-question-index="${question._index}" style="text-align: center;">
                            ${[1, 2, 3, 4, 5].map(num => `
                              <label style="display: inline-block; margin: 0 8px;">
                                <input type="radio" name="rating_${question._index}" value="${num}" style="display: none;">
                                <span class="rating-option" style="display: inline-block; width: 40px; height: 40px; border: 2px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 36px; cursor: pointer; transition: all 0.2s ease; font-weight: bold;">${num}</span>
                              </label>
                            `).join('')}
                          </div>
                        `;
                      } else if (question.itemType === 'status-ok') {
                        return `
                          <div class="status-input" data-question-index="${question._index}" style="text-align: center;">
                            <label style="display: inline-block; margin: 0 8px;">
                              <input type="radio" name="status_${question._index}" value="תקין" style="display: none;">
                              <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">✅ תקין</span>
                            </label>
                            <label style="display: inline-block; margin: 0 8px;">
                              <input type="radio" name="status_${question._index}" value="חלקי" style="display: none;">
                              <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">⚠️ חלקי</span>
                            </label>
                            <label style="display: inline-block; margin: 0 8px;">
                              <input type="radio" name="status_${question._index}" value="לא תקין" style="display: none;">
                              <span class="status-option" style="display: inline-block; padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 20px; cursor: pointer; transition: all 0.2s ease; font-weight: 600;">❌ לא תקין</span>
                            </label>
                          </div>
                        `;
                      }
                      return '';
                    })()}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
    questionsContainer.innerHTML = questionsHTML;
    setTimeout(() => { addQuestionInputListeners(); }, 100);
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

  // Defensive: Only add event listeners if elements exist
  if (branchSelect) branchSelect.addEventListener("change", checkSelections);
  if (typeSelect) typeSelect.addEventListener("change", checkSelections);

  // Defensive: Only add event listener if defineBtn exists
  if (typeof defineBtn !== 'undefined' && defineBtn) {
    defineBtn.addEventListener("click", function() {
      window.location.href = "survey-management.html";
    });
  }

  // Defensive: Only add event listener if createQuestionsBtn exists
  const createQuestionsBtn = document.getElementById('createQuestionsBtn');
  if (createQuestionsBtn) {
    createQuestionsBtn.addEventListener('click', function() {
      const typeSelect = document.getElementById('reviewTypeSelect');
      const selectedType = typeSelect ? typeSelect.value : '';
      if (selectedType && selectedType !== 'בחר סוג ביקורת...') {
        window.location.href = `questions-setup.html?survey=${encodeURIComponent(selectedType)}`;
      } else {
        alert('Please select a review type first.');
      }
    });
  }

  // Add event listener for the new header add questions button
  const addQuestionsHeaderBtn = document.getElementById('addQuestionsHeaderBtn');
  if (addQuestionsHeaderBtn) {
    addQuestionsHeaderBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const typeSelect = document.getElementById('reviewTypeSelect');
      const selectedType = typeSelect ? typeSelect.value : '';
      if (selectedType && selectedType !== 'בחר סוג ביקורת...') {
        window.location.href = `questions-setup.html?survey=${encodeURIComponent(selectedType)}`;
      } else {
        alert('יש לבחור סוג ביקורת לפני הוספת שאלות');
      }
    });
  }

  // Robust Save Review button handler
  const saveReviewBtn = document.getElementById("saveReviewBtn");
  if (saveReviewBtn) {
    saveReviewBtn.addEventListener("click", function(e) {
      e.preventDefault(); // Prevent any default form submission
      try {
        console.log('Save Review button clicked');
        saveReviewBtn.disabled = true;
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
        if (!typeValue || typeValue === "בחר סוג ביקורת..." || typeSelect.selectedIndex === -1) {
          missing.push("סוג ביקורת");
          typeSelect.style.border = "2px solid #e53935";
          setTimeout(() => { typeSelect.style.border = ""; }, 1500);
        }
        if (typeValue && typeValue !== "בחר סוג ביקורת...") {
          missing = missing.filter(m => m !== "סוג ביקורת");
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
        // Check all questions for required answers
        const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
        const selectedSurvey = surveys.find(s => s.name === typeValue);
        const questions = selectedSurvey ? selectedSurvey.questions || [] : [];
        questions.forEach((question, index) => {
          if (question.itemType === 'free-text') {
            const textarea = document.querySelector(`textarea[data-question-index="${index}"]`);
            const selectedRating = document.querySelector(`input[name="rating_${index}"]:checked`);
            if (!textarea || !textarea.value.trim()) {
              missing.push(`שאלה ${index + 1}: יש למלא תשובה טקסטואלית`);
            }
            if (!selectedRating) {
              missing.push(`שאלה ${index + 1}: יש לבחור ציון (1-5)`);
            }
          } else if (question.itemType === 'rating-1-5') {
            const selectedRating = document.querySelector(`input[name="rating_${index}"]:checked`);
            if (!selectedRating) {
              missing.push(`שאלה ${index + 1}: יש לבחור ציון (1-5)`);
            }
          } else if (question.itemType === 'status-ok') {
            const selectedStatus = document.querySelector(`input[name="status_${index}"]:checked`);
            if (!selectedStatus) {
              missing.push(`שאלה ${index + 1}: יש לבחור סטטוס (תקין/חלקי/לא תקין)`);
            }
          }
        });
        if (missing.length > 0) {
          console.log('Validation failed:', missing);
          alert("יש למלא את השדות הבאים:\n" + missing.join(", "));
          saveReviewBtn.disabled = false;
          return;
        }
        // Collect question answers and calculate scores
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
              const selectedRating = document.querySelector(`input[name="rating_${index}"]:checked`);
              if (selectedRating) {
                score = parseInt(selectedRating.value);
              }
            } else if (question.itemType === 'rating-1-5') {
              const selectedRating = document.querySelector(`input[name="rating_${index}"]:checked`);
              if (selectedRating) {
                score = parseInt(selectedRating.value);
                answer = score;
              }
            } else if (question.itemType === 'status-ok') {
              const selectedStatus = document.querySelector(`input[name="status_${index}"]:checked`);
              if (selectedStatus) {
                answer = selectedStatus.value;
                if (answer === 'תקין') score = 5;
                else if (answer === 'חלקי') score = 3;
                else score = 1;
              }
            }
            questionAnswers.push({
              questionIndex: index,
              itemName: question.itemName,
              itemType: question.itemType,
              questionText: question.questionText,
              topic: question.topic,
              answer: answer,
              score: score
            });
            if (score > 0) {
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
        console.log('Review saved successfully:', newReview);
        alert("הביקורת נוספה בהצלחה!");
        window.location.href = "reviews.html";
      } catch (err) {
        saveReviewBtn.disabled = false;
        alert("שגיאה בשמירת הביקורת: " + err.message);
        console.error("Save Review Error:", err);
      }
    });
  }
});
