function openModal() {
  document.getElementById("surveyModal").style.display = "block";
}

function closeModal() {
  document.getElementById("surveyModal").style.display = "none";
}

function saveSurvey() {
  const name = document.getElementById("surveyName").value.trim();
  const description = document.getElementById("surveyDescription").value.trim();
  if (!name) return alert("אנא הזן שם שאלון");

  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  surveys.push({ name, description, questions: [] });
  localStorage.setItem("surveys", JSON.stringify(surveys));
  renderSurveys();
  closeModal();
}

function renderSurveys() {
  const container = document.getElementById("surveyList");
  container.innerHTML = "";
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  surveys.forEach((survey, index) => {
    const card = document.createElement("div");
    card.className = "survey-card";
    card.innerHTML = `
      <div class="survey-header">${survey.name}</div>
      <p>${survey.description}</p>
      <div class="actions">
        <button class="btn btn-edit" onclick="editSurvey(${index})">✏️ עריכה</button>
        <button class="btn btn-delete" onclick="deleteSurvey(${index})">🗑 מחיקה</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteSurvey(index) {
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  if (confirm("האם אתה בטוח שברצונך למחוק שאלון זה?")) {
    surveys.splice(index, 1);
    localStorage.setItem("surveys", JSON.stringify(surveys));
    renderSurveys();
  }
}

function editSurvey(index) {
  // Stub for edit functionality
  alert('עריכת שאלון תיתמך בקרוב.');
}

document.addEventListener("DOMContentLoaded", function() {
  renderSurveys();
  const modal = document.getElementById("surveyModal");
  if (modal) {
    const btns = modal.getElementsByTagName("button");
    for (let btn of btns) {
      if (btn.textContent.includes("שמור")) {
        btn.onclick = saveSurvey;
      }
    }
  }
  // Attach saveSurvey to Save and Exit button
  const saveBtn = document.getElementById("saveSurveyBtn");
  if (saveBtn) saveBtn.onclick = saveSurvey;
});
