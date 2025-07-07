// פונקציות עבור כפתורי פעולה (צפייה, עריכה, מחיקה)
function attachActions() {
  document.querySelectorAll(".btn-delete").forEach((btn, index) => {
    btn.onclick = function () {
      if (confirm("האם אתה בטוח שברצונך למחוק את הסניף הזה?")) {
        const branches = JSON.parse(localStorage.getItem('branches') || '[]');
        branches.splice(index, 1);
        localStorage.setItem('branches', JSON.stringify(branches));
        // Remove row from UI
        btn.closest('tr').remove();
      }
    };
  });

  document.querySelectorAll(".btn-view").forEach((btn, index) => {
    btn.onclick = function () {
      const branches = JSON.parse(localStorage.getItem('branches') || '[]');
      const branch = branches[index];
      localStorage.setItem('currentBranch', JSON.stringify(branch));
      localStorage.setItem('currentBranchIndex', index);
      window.location.href = 'branch-details.html';
    };
  });

  document.querySelectorAll(".btn-edit").forEach((btn, index) => {
    btn.onclick = function () {
      const branches = JSON.parse(localStorage.getItem('branches') || '[]');
      const branch = branches[index];
      openBranchPopup(branch, index);
    };
  });
}

function closeModal() {
  const modal = document.getElementById("branchModal");
  if (modal) modal.parentElement.remove();
  document.body.style.overflow = "auto";
  // Remove focus from any element
  if (document.activeElement) document.activeElement.blur();
}

function getBadge(className, text) {
  return `<span class="tag tag-${className}">${text}</span>`;
}

function addBranchToTable(branch, index) {
  const table = document.getElementById("branch-list");
  const row = document.createElement("tr");

  // Determine badge classes
  const businessBadge = branch.businessType === "חברה" || branch.businessType === "חברה בע\"מ" ? 'purple' : branch.businessType === "עוסק מורשה" ? 'primary' : 'gray';
  const kosherBadge = branch.kosherType?.includes("בד") ? 'success' : branch.kosherType?.includes("צהר") ? 'primary' : branch.kosherType?.includes("רגילה") ? 'gray' : 'secondary';
  const statusBadge = branch.status === "פעיל" ? 'success' : branch.status === "בשיפוצים" ? 'warning' : branch.status === "לא פעיל" ? 'danger' : 'secondary';

  row.innerHTML = `
    <td>
      <div class="branch-name">${branch.name || ''}</div>
      <div class="branch-sub">${branch.city || ''}</div>
    </td>
    <td>${branch.address || ''}</td>
    <td>${getBadge(businessBadge, branch.businessType || 'לא מוגדר')}</td>
    <td>${getBadge(kosherBadge, branch.kosherType || 'ללא')}</td>
    <td>${getBadge(statusBadge, branch.status || 'לא מוגדר')}</td>
    <td class="action-btns">
      <button class="btn btn-icon btn-view view" data-index="${index}">👁️ צפייה</button>
      <button class="btn btn-icon btn-edit edit" data-index="${index}">✏️ עריכה</button>
      <button class="btn btn-icon btn-delete delete" data-index="${index}">🗑️ מחיקה</button>
    </td>
  `;
  table.appendChild(row);
  attachActions();
}

// טעינה ראשונית של הסניפים
function loadBranches() {
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  branches.forEach(addBranchToTable);
}

function openBranchPopup(branch = null, index = null) {
  fetch('popup.html')
    .then(res => res.text())
    .then(html => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      document.body.appendChild(modalContainer);
      document.body.style.overflow = "hidden";

      // Add fade-in effect
      const modal = document.getElementById("branchModal");
      modal.style.opacity = 0;
      setTimeout(() => { modal.style.transition = 'opacity 0.22s'; modal.style.opacity = 1; }, 10);

      const saveBtn = modal.querySelector('[data-save]');
      const saveExitBtn = modal.querySelector('[data-save-exit]');
      const cancelBtn = modal.querySelector('[data-cancel]');
      const form = modal.querySelector("#branchForm");

      // Focus first input
      setTimeout(() => { const firstInput = form.querySelector('input,select'); if (firstInput) firstInput.focus(); }, 100);

      // Pre-fill or reset form
      if (branch) {
        Object.entries(branch).forEach(([key, value]) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = value;
        });
      } else {
        form.reset();
      }

      function saveDataAndMaybeClose(closeAfter) {
        const inputs = form.querySelectorAll("input[name], select[name]");
        const data = {};
        inputs.forEach(input => {
          if (input.type === 'file') return;
          data[input.name] = input.value.trim();
        });
        if (!data["name"] || !data["address"] || !data["businessType"] || !data["status"]) {
          alert("נא למלא את כל השדות החיוניים: שם סניף, כתובת, סוג עסק, סטטוס");
          return;
        }
        let branches = JSON.parse(localStorage.getItem("branches") || "[]");
        if (branch && index !== null) {
          branches[index] = data;
        } else {
          branches.push(data);
        }
        localStorage.setItem("branches", JSON.stringify(branches));
        document.getElementById("branch-list").innerHTML = "";
        branches.forEach((b, i) => addBranchToTable(b, i));
        if (closeAfter) closeModal();
      }

      if (saveBtn) {
        saveBtn.addEventListener("click", () => saveDataAndMaybeClose(false));
      }
      if (saveExitBtn) {
        saveExitBtn.addEventListener("click", () => saveDataAndMaybeClose(true));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
      }
    });
}

// Update Add/Edit button logic to use openBranchPopup
window.onload = function() {
  loadBranches();
  const addBtn = document.querySelector('.add-btn');
  if (addBtn) {
    addBtn.onclick = function() { openBranchPopup(); };
  }
};
