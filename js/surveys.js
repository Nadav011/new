let editingSurveyIndex = null;

function openModal(editIndex = null) {
  const modal = document.getElementById("surveyModal");
  modal.style.display = "block";
  editingSurveyIndex = editIndex;
  if (editIndex !== null) {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const survey = surveys[editIndex];
    document.getElementById("surveyName").value = survey.name;
    document.getElementById("surveyDescription").value = survey.description;
    document.getElementById("surveyModalTitle").textContent = "עריכת שאלון";
  } else {
    document.getElementById("surveyName").value = "";
    document.getElementById("surveyDescription").value = "";
    document.getElementById("surveyModalTitle").textContent = "יצירת שאלון חדש";
  }
}

function closeModal() {
  document.getElementById("surveyModal").style.display = "none";
  editingSurveyIndex = null;
}

function saveSurvey() {
  const name = document.getElementById("surveyName").value.trim();
  const description = document.getElementById("surveyDescription").value.trim();
  if (!name) return alert("אנא הזן שם שאלון");

  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  if (editingSurveyIndex !== null) {
    // Edit mode
    surveys[editingSurveyIndex].name = name;
    surveys[editingSurveyIndex].description = description;
  } else {
    // Add mode
    surveys.push({ name, description, questions: [] });
  }
  localStorage.setItem("surveys", JSON.stringify(surveys));
  renderSurveys();
  closeModal();
}

// פונקציה שממירה מחרוזת לצבע HSL רך וייחודי (דטרמיניסטי, עם salt)
function stringToHslColor(str, s = 60, l = 85) {
  str = str + 'surveys-color'; // salt
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function renderSurveys() {
  const container = document.getElementById("surveyList");
  container.innerHTML = "";
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  surveys.forEach((survey, index) => {
    const card = document.createElement("div");
    card.className = "survey-card";
    // Review type badge mapping (צבע דינאמי רך + עיצוב אחיד)
    const bgColor = stringToHslColor(survey.name, 60, 85);
    const typeHtml = `<span class="badge" style="background: ${bgColor}; color: #1d1d1f;">${survey.name}</span>`;
    card.innerHTML = `
      <div class="survey-header">${typeHtml}</div>
      <p>${survey.description}</p>
      <div class="actions">
        <button class="btn btn-edit" onclick="openModal(${index})">✏️ עריכה</button>
        <button class="btn btn-delete" onclick="deleteSurvey(${index})">🗑 מחיקה</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Small delay to ensure CSS is applied
  setTimeout(() => {
    // Any additional initialization can go here
  }, 10);
}

function deleteSurvey(index) {
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  if (confirm("האם אתה בטוח שברצונך למחוק שאלון זה?")) {
    surveys.splice(index, 1);
    localStorage.setItem("surveys", JSON.stringify(surveys));
    renderSurveys();
  }
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
