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

  // טען סוגי ביקורת מהשאלונים (surveys)
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

    // Find the survey with this name
    const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
    const selectedSurvey = surveys.find(s => s.name === reviewTypeName);

    if (selectedSurvey && selectedSurvey.questions && selectedSurvey.questions.length > 0) {
      // Display questions
      const questionsList = document.createElement("ul");
      questionsList.className = "questions-list";
      selectedSurvey.questions.forEach(question => {
        const listItem = document.createElement("li");
        listItem.textContent = question;
        questionsList.appendChild(listItem);
      });
      questionsContainer.innerHTML = "";
      questionsContainer.appendChild(questionsList);
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

  // Add event listeners for select changes
  branchSelect.addEventListener("change", checkSelections);
  typeSelect.addEventListener("change", checkSelections);

  // Handle 'Go to define questions' button
  defineBtn.addEventListener("click", function() {
    alert("פונקציונליות זו תהיה זמינה בקרוב!");
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
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const newReview = {
      branch: branchSelect.value,
      type: typeSelect.value,
      reviewer: reviewerInput.value,
      date: dateInput.value,
      managerSummary: document.getElementById("managerSummary").value,
      keyStrengths: document.getElementById("keyStrengths").value,
      areasForImprovement: document.getElementById("areasForImprovement").value
    };
    reviews.push(newReview);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    alert("הביקורת נוספה בהצלחה!");
    window.location.href = "reviews.html";
  });
});
