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
      // Find the closest tr (row) for this button
      let row = btn.closest('tr');
      if (!row) {
        alert('Could not find the row for this branch!');
        return;
      }
      openInlineEditForm(branch, index, row);
    };
  });
}

function closeModal() {
  const modal = document.getElementById("branchModal");
  if (modal) {
    modal.parentElement.remove();
    document.body.style.overflow = "auto";
    // Remove focus from any element
    if (document.activeElement) document.activeElement.blur();
  }
}

function getBadge(className, text) {
  return `<span class="badge ${className}">${text}</span>`;
}

function addBranchToTable(branch, index) {
  const table = document.getElementById("branch-list");
  
  if (!table) {
    console.error('branch-list table not found!');
    return;
  }
  
  const row = document.createElement("tr");

  // Determine badge classes
  const businessBadge = branch.businessType === "חברה" || branch.businessType === "חברה בע\"מ" ? 'primary' : branch.businessType === "עוסק מורשה" ? 'gray' : 'gray';
  const kosherBadge = branch.kosherType?.includes("בד") ? 'success' : branch.kosherType?.includes("צהר") ? 'primary' : branch.kosherType?.includes("רגילה") ? 'gray' : 'gray';
  const statusBadge = branch.status === "פעיל" ? 'success' : branch.status === "בשיפוצים" ? 'warning' : branch.status === "לא פעיל" ? 'danger' : 'gray';

  row.innerHTML = `
    <td data-label="שם סניף" style="text-align:center;">
      <span class="badge primary branch-main">${branch.name || ''}</span>
      <div class="branch-sub">${branch.city || ''}</div>
    </td>
    <td data-label="כתובת"><span class="badge gray">${branch.address || ''}</span></td>
    <td data-label="סוג עסק">${getBadge(businessBadge, branch.businessType || 'לא מוגדר')}</td>
    <td data-label="כשרות">${getBadge(kosherBadge, branch.kosherType || 'ללא')}</td>
    <td data-label="סטטוס">${getBadge(statusBadge, branch.status || 'לא מוגדר')}</td>
    <td data-label="פעולות" class="action-btns" style="display:flex;gap:8px;align-items:center;justify-content:center;">
      <button class="btn btn-icon btn-view view" data-index="${index}">👁️ צפייה</button>
      <button class="btn btn-icon btn-edit edit" data-index="${index}">✏️ עריכה</button>
      <button class="btn btn-icon btn-delete delete" data-index="${index}">🗑️ מחיקה</button>
    </td>
  `;
  table.appendChild(row);
  
  // Small delay to ensure CSS is applied
  setTimeout(() => {
    attachActions();
  }, 10);
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
      const cancelBtn = modal.querySelector('[data-cancel]');
      const closeBtn = modal.querySelector('.modal-close');
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

      function saveDataAndClose() {
        // קח את הטופס מתוך ה-modalContainer, לא מה-document!
        const form = modalContainer.querySelector('#branchForm');
        const data = {};
        form.querySelectorAll('input[name], select[name]').forEach(input => {
          if (input.type === 'file') {
            if (input.files && input.files.length > 0) {
              data[input.name] = input.files[0].name;
              console.log('קובץ שנבחר:', input.name, input.files[0].name);
            } else if (branch && branch[input.name]) {
              data[input.name] = branch[input.name];
            } else {
              data[input.name] = '';
              console.log('לא נבחר קובץ עבור:', input.name);
            }
            return;
          }
          data[input.name] = input.value.trim();
        });
        // בעתיד: להעלות את כל formData לשרת עם fetch('/api/branches', { method: 'POST', body: formData })
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
        
        // Clear and rebuild table
        const branchList = document.getElementById("branch-list");
        if (branchList) {
          branchList.innerHTML = "";
          branches.forEach((b, i) => addBranchToTable(b, i));
        } else {
          console.error('branch-list element not found!');
        }
        
        // Show success message and close popup
        const saveBtn = modal.querySelector('[data-save]');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'נשמר בהצלחה!';
        saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        saveBtn.disabled = true;
        
        setTimeout(() => {
          closeModal();
        }, 1000);
      }

      if (saveBtn) {
        saveBtn.addEventListener("click", saveDataAndClose);
      }
      if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
      }
    });
}

// Inline edit form logic
function openInlineEditForm(branch, index, rowElement) {
  // Remove any existing inline edit forms
  document.querySelectorAll('.inline-edit-row').forEach(el => el.remove());

  // Create a new row for the edit form
  const editRow = document.createElement('tr');
  editRow.className = 'inline-edit-row';
  const td = document.createElement('td');
  td.colSpan = 6;
  td.style.padding = '0';

  // Build the form (compact, card style)
  td.innerHTML = `
    <div class="inline-edit-card">
      <form class="inline-edit-form">
        <div class="inline-edit-grid">
          <div class="form-group">
            <label>שם הסניף</label>
            <input type="text" name="name" value="${branch.name || ''}" required />
          </div>
          <div class="form-group">
            <label>עיר</label>
            <input type="text" name="city" value="${branch.city || ''}" />
          </div>
          <div class="form-group">
            <label>כתובת</label>
            <input type="text" name="address" value="${branch.address || ''}" required />
          </div>
          <div class="form-group">
            <label>סוג עסק</label>
            <select name="businessType" required>
              <option disabled ${!branch.businessType ? 'selected' : ''} value="">בחר סוג עסק</option>
              <option ${branch.businessType === 'עוסק מורשה' ? 'selected' : ''}>עוסק מורשה</option>
              <option ${branch.businessType === 'חברה בע"מ' ? 'selected' : ''}>חברה בע"מ</option>
            </select>
          </div>
          <div class="form-group">
            <label>סטטוס</label>
            <select name="status" required>
              <option disabled ${!branch.status ? 'selected' : ''} value="">בחר סטטוס הסניף</option>
              <option ${branch.status === 'פעיל' ? 'selected' : ''}>פעיל</option>
              <option ${branch.status === 'לא פעיל' ? 'selected' : ''}>לא פעיל</option>
              <option ${branch.status === 'בשיפוצים' ? 'selected' : ''}>בשיפוצים</option>
            </select>
          </div>
          <div class="form-group">
            <label>סוג כשרות</label>
            <select name="kosherType" required>
              <option disabled ${!branch.kosherType ? 'selected' : ''} value="">בחר סוג כשרות</option>
              <option ${branch.kosherType === 'כשרות רגילה' ? 'selected' : ''}>כשרות רגילה</option>
              <option ${branch.kosherType === 'כשרות בד"ץ' ? 'selected' : ''}>כשרות בד"ץ</option>
              <option ${branch.kosherType === 'כשרות צהר' ? 'selected' : ''}>כשרות צהר</option>
              <option ${branch.kosherType === 'ללא תעודת כשרות' ? 'selected' : ''}>ללא תעודת כשרות</option>
            </select>
          </div>
          <div class="form-group">
            <label>שם מנהל הסניף</label>
            <input type="text" name="managerName" value="${branch.managerName || ''}" />
          </div>
          <div class="form-group">
            <label>טלפון מנהל הסניף</label>
            <input type="text" name="managerPhone" value="${branch.managerPhone || ''}" />
          </div>
          <div class="form-group">
            <label>שם זכיין</label>
            <input type="text" name="firstName" value="${branch.firstName || ''}" />
          </div>
          <div class="form-group">
            <label>שם משפחה</label>
            <input type="text" name="lastName" value="${branch.lastName || ''}" />
          </div>
          <div class="form-group">
            <label>טלפון זכיין</label>
            <input type="text" name="phone" value="${branch.phone || ''}" />
          </div>
          <div class="form-group">
            <label>מספר תעודת זהות</label>
            <input type="text" name="idNumber" value="${branch.idNumber || ''}" />
          </div>
          <div class="form-group">
            <label>כתובת זכיין</label>
            <input type="text" name="ownerAddress" value="${branch.ownerAddress || ''}" />
          </div>
          <div class="form-group">
            <label>איש קשר</label>
            <input type="text" name="contact" value="${branch.contact || ''}" />
          </div>
          <div class="form-group">
            <label>אימייל</label>
            <input type="email" name="email" value="${branch.email || ''}" />
          </div>
          <div class="form-group">
            <label>הערות</label>
            <input type="text" name="notes" value="${branch.notes || ''}" />
          </div>
          <div class="form-section">
            <div class="section-title">מסמכים נדרשים</div>
            <div class="file-upload-group">
              <div class="file-upload-item">
                <label for="idFile">תעודת זהות</label>
                <input type="file" id="idFile" name="idFile" accept=".pdf,image/*">
                <span class="badge file-badge" id="idFile-badge">לא נבחר קובץ</span>
              </div>
              <div class="file-upload-item">
                <label for="companyFile">תעודת התאגדות</label>
                <input type="file" id="companyFile" name="companyFile" accept=".pdf,image/*">
                <span class="badge file-badge" id="companyFile-badge">לא נבחר קובץ</span>
              </div>
              <div class="file-upload-item">
                <label for="signatureFile">מורשה חתימה</label>
                <input type="file" id="signatureFile" name="signatureFile" accept=".pdf,image/*">
                <span class="badge file-badge" id="signatureFile-badge">לא נבחר קובץ</span>
              </div>
              <div class="file-upload-item">
                <label for="bankFile">פרטי חשבון בנק</label>
                <input type="file" id="bankFile" name="bankFile" accept=".pdf,image/*">
                <span class="badge file-badge" id="bankFile-badge">לא נבחר קובץ</span>
              </div>
              <div class="file-upload-item">
                <label for="approvalFile">אישור ניהול ספרים</label>
                <input type="file" id="approvalFile" name="approvalFile" accept=".pdf,image/*">
                <span class="badge file-badge" id="approvalFile-badge">לא נבחר קובץ</span>
              </div>
            </div>
          </div>
        </div>
        <div class="btn-row" style="margin-top:16px;">
          <button type="submit" class="btn btn-primary">שמור</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('tr').remove()">ביטול</button>
        </div>
      </form>
    </div>
  `;
  editRow.appendChild(td);

  // Insert the edit row after the current row
  if (rowElement && rowElement.parentNode) {
    rowElement.parentNode.insertBefore(editRow, rowElement.nextSibling);
  }

  // Handle form submission
  const form = td.querySelector('form');
  
  // Add file input event listeners
  const fileInputs = form.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    const badge = document.getElementById(input.id + '-badge');
    // Set existing file name if available
    if (branch[input.name]) {
      badge.textContent = branch[input.name];
      badge.style.color = '#333';
      badge.style.background = '#e8f5e8';
      badge.style.borderColor = '#10b981';
    } else {
      badge.textContent = 'לא נבחר קובץ';
      badge.style.color = '#bbb';
      badge.style.background = '#f3f4f6';
      badge.style.borderColor = '#d1d5db';
    }
    input.addEventListener('change', function() {
      if (input.files && input.files.length > 0) {
        let name = input.files[0].name;
        badge.textContent = name;
        badge.style.color = '#333';
        badge.style.background = '#e8f5e8';
        badge.style.borderColor = '#10b981';
      } else {
        badge.textContent = 'לא נבחר קובץ';
        badge.style.color = '#bbb';
        badge.style.background = '#f3f4f6';
        badge.style.borderColor = '#d1d5db';
      }
    });
  });
  
  form.onsubmit = function(e) {
    e.preventDefault();
    const data = {};
    form.querySelectorAll('input,select').forEach(input => {
      if (input.type === 'file') {
        if (input.files.length > 0) {
          data[input.name] = input.files[0].name;
        } else if (branch[input.name]) {
          data[input.name] = branch[input.name];
        }
      } else {
        data[input.name] = input.value.trim();
      }
    });
    let branches = JSON.parse(localStorage.getItem('branches') || '[]');
    branches[index] = { ...branches[index], ...data };
    localStorage.setItem('branches', JSON.stringify(branches));
    // Update only the relevant row in the DOM
    updateBranchRow(rowElement, branches[index], index);
    editRow.remove();
  };
  td.querySelector('.btn-cancel-outline').onclick = function() {
    editRow.remove();
  };
}

// Helper to update only the relevant row
function updateBranchRow(row, branch, index) {
  const businessBadge = branch.businessType === "חברה" || branch.businessType === "חברה בע\"מ" ? 'primary' : branch.businessType === "עוסק מורשה" ? 'gray' : 'gray';
  const kosherBadge = branch.kosherType?.includes("בד") ? 'success' : branch.kosherType?.includes("צהר") ? 'primary' : branch.kosherType?.includes("רגילה") ? 'gray' : 'gray';
  const statusBadge = branch.status === "פעיל" ? 'success' : branch.status === "בשיפוצים" ? 'warning' : branch.status === "לא פעיל" ? 'danger' : 'gray';

  const cells = row.children;
  if (cells[0]) {
    cells[0].innerHTML = `<span class="badge primary branch-main">${branch.name || ''}</span><div class="branch-sub">${branch.city || ''}</div>`;
  }
  if (cells[1]) cells[1].innerHTML = `<span class="badge gray">${branch.address || ''}</span>`;
  if (cells[2]) cells[2].innerHTML = getBadge(businessBadge, branch.businessType || 'לא מוגדר');
  if (cells[3]) cells[3].innerHTML = getBadge(kosherBadge, branch.kosherType || 'ללא');
  if (cells[4]) cells[4].innerHTML = getBadge(statusBadge, branch.status || 'לא מוגדר');
}

// Update Add/Edit button logic to use openBranchPopup
window.onload = function() {
  loadBranches();
  const addBtn = document.querySelector('.add-btn');
  if (addBtn) {
    addBtn.onclick = function() { openBranchPopup(); };
  }
};
