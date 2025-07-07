
function openReviewModal(surveyName) {
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  const survey = surveys.find(s => s.name === surveyName);

  if (!survey) {
    alert("שאלון לא נמצא");
    return;
  }

  document.getElementById("modal-title").textContent = survey.name;
  document.getElementById("modal-description").textContent = survey.description || "אין תיאור";

  const questionsBody = document.getElementById("questions-body");
  const noQuestions = document.getElementById("no-questions");
  const table = document.getElementById("questions-table");

  questionsBody.innerHTML = "";

  if (survey.questions && survey.questions.length > 0) {
    noQuestions.style.display = "none";
    table.style.display = "table";

    survey.questions.forEach(q => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${q.text || "—"}</td>
        <td>${q.type || "—"}</td>
        <td>${q.answer || "-"}</td>
      `;
      questionsBody.appendChild(row);
    });
  } else {
    table.style.display = "none";
    noQuestions.style.display = "block";
  }

  document.getElementById("reviewModal").style.display = "flex";
  localStorage.setItem("lastSurveyViewed", survey.name);
}

function closeReviewModal() {
  document.getElementById("reviewModal").style.display = "none";
}

function goToSurveyEdit() {
  const name = localStorage.getItem("lastSurveyViewed");
  alert("מעבר לעריכת שאלון: " + name);
  window.location.href = "surveys.html";
}
