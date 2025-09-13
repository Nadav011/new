// Branch Details Page Logic
window.addEventListener('load', function() {
  // Get branch index from URL or fallback to localStorage
  const urlParams = new URLSearchParams(window.location.search);
  let branchIndex = urlParams.get('index');
  let branches = JSON.parse(localStorage.getItem('branches') || '[]');
  let branch = null;
  if (branchIndex !== null && branches[branchIndex]) {
    branch = branches[branchIndex];
  } else if (localStorage.getItem('currentBranch')) {
    branch = JSON.parse(localStorage.getItem('currentBranch'));
    branchIndex = branches.findIndex(b => b.name === branch.name);
  }
  if (!branch) return;

  window.currentBranch = branch;
  window.currentBranchIndex = branchIndex; // Store index globally

  // --- Render Branch Details ---
  document.getElementById("branch-name").textContent = branch.name || '-';
  document.getElementById("branch-address").textContent = `${branch.address || ''}${branch.city ? ', ' + branch.city : ''}`;
  document.getElementById("branch-details-list").innerHTML = `
    <li><strong>מנהל:</strong> <span>${branch.manager || '-'}</span></li>
    <li><strong>טלפון מנהל:</strong> <span>${branch.managerPhone || '-'}</span></li>
    <li><strong>סוג כשרות:</strong> <span>${branch.kosherType || '-'}</span></li>
    <li><strong>סטטוס:</strong> <span>${branch.status || '-'}</span></li>
    <li><strong>זכיין:</strong> <span>${branch.firstName || ''} ${branch.lastName || ''}</span></li>
    <li><strong>טלפון זכיין:</strong> <span>${branch.phone || '-'}</span></li>
    <li><strong>סוג עסק:</strong> <span>${branch.businessType || '-'}</span></li>
  `;
  // Attachments
  const attachmentsDiv = document.getElementById('branch-attachments');
  if (branch.attachments && Array.isArray(branch.attachments) && branch.attachments.length > 0) {
    attachmentsDiv.innerHTML = `<h4 style="margin-bottom:8px;">קבצים מצורפים</h4><ul style="list-style:none;padding:0;">${branch.attachments.map(att => `<li style='margin-bottom:8px;'><a href='${att.url}' target='_blank' style='color:#1976d2;font-weight:600;text-decoration:underline;'>${att.name}</a></li>`).join('')}</ul>`;
  } else {
    attachmentsDiv.innerHTML = '';
  }

  // --- Stats ---
  const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
  const branchReviews = reviews.filter(r => r.branch === branch.name);
  const statBoxes = document.querySelectorAll('.stat-box .stat-value');
  if (statBoxes.length >= 4) {
    statBoxes[3].innerHTML = `<span class='badge'>${branchReviews.length}</span>`;
    if (branchReviews.length > 0) {
      const scores = branchReviews.map(r => typeof r.averageScore === 'number' ? r.averageScore : (r.score || 0));
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      // Helper to get class
      function getStatBoxClass(val) {
        if (val >= 4) return 'high';
        if (val >= 3) return 'medium';
        return 'low';
      }
      // Remove old color classes
      statBoxes[0].parentElement.classList.remove('high','medium','low');
      statBoxes[1].parentElement.classList.remove('high','medium','low');
      statBoxes[2].parentElement.classList.remove('high','medium','low');
      // Add new color classes
      statBoxes[0].parentElement.classList.add(getStatBoxClass(min));
      statBoxes[1].parentElement.classList.add(getStatBoxClass(max));
      statBoxes[2].parentElement.classList.add(getStatBoxClass(avg));
      // Render colored badges for min, max, avg
      function getScoreBadgeClass(val) {
        if (val >= 4) return ' high';
        if (val >= 3) return ' medium';
        return ' low';
      }
      statBoxes[0].innerHTML = `<span class='score-badge${getScoreBadgeClass(min)}'>${min.toFixed(1)}</span>`;
      statBoxes[1].innerHTML = `<span class='score-badge${getScoreBadgeClass(max)}'>${max.toFixed(1)}</span>`;
      statBoxes[2].innerHTML = `<span class='score-badge${getScoreBadgeClass(avg)}'>${avg.toFixed(2)}</span>`;
    } else {
      statBoxes[0].innerHTML = `<span class='score-badge low'>0</span>`;
      statBoxes[1].innerHTML = `<span class='score-badge low'>0</span>`;
      statBoxes[2].innerHTML = `<span class='score-badge low'>0</span>`;
      statBoxes[3].innerHTML = `<span class='badge'>0</span>`;
    }
  }

  // --- Review History ---
  const reviewsHistory = document.querySelector('.reviews-history');
  const emptyMsg = reviewsHistory.querySelector('.reviews-empty');
  if (branchReviews.length === 0) {
    emptyMsg.style.display = 'block';
    if (reviewsHistory.querySelector('table')) {
      reviewsHistory.querySelector('table').remove();
    }
  } else {
    emptyMsg.style.display = 'none';
    let table = reviewsHistory.querySelector('table');
    if (!table) {
      table = document.createElement('table');
      table.className = 'branch-reviews-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>שם מבקר</th>
            <th>תאריך</th>
            <th>סוג ביקורת</th>
            <th>ציון סופי</th>
            <th>שם סניף</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      reviewsHistory.appendChild(table);
    }
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    branchReviews.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const score = typeof r.averageScore === 'number' ? r.averageScore : (r.score || 0);
      function getScoreBadgeClass(val) {
        if (val >= 4) return ' high';
        if (val >= 3) return ' medium';
        return ' low';
      }
      let scoreClass = 'score-badge' + getScoreBadgeClass(score);
      // Review type badge mapping (צבע דינאמי רך)
      const typeName = (r.type || '').trim();
      const bgColor = stringToHslColor(typeName, 60, 85);
      const typeHtml = `<span class='badge' style="background: ${bgColor}; color: #1d1d1f;">${typeName}</span>`;
      // מבקר ותאריך ב-badge עגול ורך (כמו ב-reviews.js)
      const reviewerBadge = `<span class='badge gray'>${r.reviewer || '-'}</span>`;
      const dateBadge = `<span class='badge date-soft'><span class='calendar-icon'>📅</span> ${r.date || '-'}</span>`;
      // שם הסניף וכתובת ב-badge עגול ללא צבע (ברירת מחדל)
      const branchNameBadge = `<span class='badge primary'>${r.branch || '-'}</span>`;
      tr.innerHTML = `
        <td>${reviewerBadge}</td>
        <td>${dateBadge}</td>
        <td>${typeHtml}</td>
        <td class="score-cell"><span class="${scoreClass}">${score.toFixed(2)}/5</span></td>
        <td>${branchNameBadge}</td>
        <td>${r.comments || ''}</td>
      `;
      tr.style.cursor = 'pointer';
      tr.onclick = function() {
        localStorage.setItem('currentReview', JSON.stringify(r));
        localStorage.setItem('currentReviewIndex', reviews.indexOf(r));
        window.location.href = 'review-view.html';
      };
      tbody.appendChild(tr);
    });
  }

  // --- Activate Edit Branch Button ---
  const editBtn = document.querySelector('.btn-edit');
  if (editBtn) {
    editBtn.onclick = function() {
      // Open the branch popup with current branch data
      openBranchPopupForDetails(branch, branchIndex);
    };
  }
});

// --- Branch Files Modal Logic ---
document.addEventListener('DOMContentLoaded', function() {
  const showFilesBtn = document.getElementById('showFilesBtn');
  const filesBox = document.getElementById('branch-files-box');
  if (showFilesBtn && filesBox) {
    showFilesBtn.onclick = function() {
      if (filesBox.style.display === 'none' || filesBox.style.display === '') {
        let filesHtml = '';
        if (window.currentBranch) {
          const fileFields = [
            { key: 'idFile', label: 'תעודת זהות' },
            { key: 'companyFile', label: 'תעודת התאגדות' },
            { key: 'signatureFile', label: 'מורשה חתימה' },
            { key: 'bankFile', label: 'פרטי חשבון בנק' },
            { key: 'approvalFile', label: 'אישור ניהול ספרים' }
          ];
          filesHtml = '<h4>קבצים של הסניף</h4>';
          filesHtml += '<ul class="branch-files-list">';
          let hasFile = false;
          fileFields.forEach(f => {
            const fileObj = window.currentBranch[f.key];
            if (fileObj && fileObj.url) {
              hasFile = true;
              filesHtml += `<li class='branch-file-row'><button class='branch-file-badge' data-file-key='${f.key}' title='צפייה'><span class='branch-file-badge-label'>${f.label}<span class='eye-icon' aria-label='צפייה'><svg width='14' height='14' viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M11 5C6.5 5 2.73 8.11 1 11c1.73 2.89 5.5 6 10 6s8.27-3.11 10-6c-1.73-2.89-5.5-6-10-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6.5A2.5 2.5 0 1 0 11 15a2.5 2.5 0 0 0 0-5z' fill='#4f8cff' stroke='#1976d2' stroke-width='0.5'/></svg></span></span></button></li>`;
            }
          });
          filesHtml += '</ul>';
          if (!hasFile) filesHtml += '<div class="no-files">לא הועלו קבצים לסניף זה.</div>';
        } else {
          filesHtml = '<div class="no-files">לא נמצאו נתוני קבצים לסניף.</div>';
        }
        filesBox.innerHTML = filesHtml;
        filesBox.style.display = 'block';

        // Add popup logic for file preview
        filesBox.querySelectorAll('.branch-file-badge').forEach(btn => {
          btn.onclick = function(e) {
            e.preventDefault();
            const fileKey = btn.getAttribute('data-file-key');
            const fileObj = window.currentBranch[fileKey];
            if (!fileObj || !fileObj.url) return;
            // Create modal
            let modal = document.createElement('div');
            modal.className = 'file-preview-modal';
            modal.innerHTML = `
              <div class='file-preview-modal-content'>
                <button class='file-preview-close' title='סגור'>&times;</button>
                <div class='file-preview-body'>
                  ${fileObj.url.match(/\.pdf$/i) ?
                    `<embed src='${fileObj.url}' type='application/pdf' class='file-preview-embed' />` :
                    `<img src='${fileObj.url}' class='file-preview-img' alt='קובץ' />`
                  }
                </div>
                <div class='file-preview-actions'>
                  <button class='btn btn-primary file-edit-btn'>עריכה</button>
                  <button class='btn btn-secondary file-cancel-btn'>ביטול</button>
                </div>
              </div>
            `;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            // Close logic
            modal.querySelector('.file-preview-close').onclick = closeModal;
            modal.querySelector('.file-cancel-btn').onclick = closeModal;
            function closeModal() {
              document.body.style.overflow = '';
              modal.remove();
            }
            // Edit button logic (implement as needed)
            modal.querySelector('.file-edit-btn').onclick = function() {
              // If already editing, do nothing
              if (modal.querySelector('.file-upload-edit-row')) return;
              // Add file input below preview
              const actionsDiv = modal.querySelector('.file-preview-actions');
              const uploadRow = document.createElement('div');
              uploadRow.className = 'file-upload-edit-row';
              uploadRow.style.display = 'flex';
              uploadRow.style.flexDirection = 'column';
              uploadRow.style.alignItems = 'center';
              uploadRow.style.width = '100%';
              uploadRow.style.margin = '18px 0 0 0';
              uploadRow.innerHTML = `
                <label class='file-upload-label' style='font-weight:600;font-size:1.08rem;margin-bottom:8px;color:#1976d2;cursor:pointer;'>
                  בחר קובץ חדש
                  <input type='file' accept='.pdf,image/*' style='display:none;'>
                </label>
                <div class='file-upload-edit-actions' style='display:flex;gap:14px;margin-top:10px;'>
                  <button class='btn btn-primary file-save-btn'>שמור</button>
                  <button class='btn btn-secondary file-cancel-edit-btn'>ביטול</button>
                </div>
              `;
              actionsDiv.parentNode.insertBefore(uploadRow, actionsDiv.nextSibling);
              let selectedFile = null;
              const fileInput = uploadRow.querySelector('input[type="file"]');
              fileInput.onchange = function(e) {
                if (!fileInput.files || !fileInput.files[0]) return;
                selectedFile = fileInput.files[0];
                // Show preview
                const reader = new FileReader();
                reader.onload = function(ev) {
                  const previewBody = modal.querySelector('.file-preview-body');
                  if (selectedFile.type === 'application/pdf') {
                    previewBody.innerHTML = `<embed src='${ev.target.result}' type='application/pdf' class='file-preview-embed' />`;
                  } else {
                    previewBody.innerHTML = `<img src='${ev.target.result}' class='file-preview-img' alt='קובץ' />`;
                  }
                };
                reader.readAsDataURL(selectedFile);
              };
              // Cancel edit
              uploadRow.querySelector('.file-cancel-edit-btn').onclick = function() {
                uploadRow.remove();
              };
              // Save new file
              uploadRow.querySelector('.file-save-btn').onclick = function() {
                if (!selectedFile) {
                  alert('יש לבחור קובץ חדש');
                  return;
                }
                const reader = new FileReader();
                reader.onload = function(ev) {
                  // Update localStorage
                  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
                  const branchIdx = window.currentBranchIndex;
                  if (branchIdx == null || !branches[branchIdx]) return;
                  const fileField = fileKey;
                  branches[branchIdx][fileField] = {
                    url: ev.target.result,
                    name: selectedFile.name
                  };
                  localStorage.setItem('branches', JSON.stringify(branches));
                  window.currentBranch[fileField] = {
                    url: ev.target.result,
                    name: selectedFile.name
                  };
                  // Update preview
                  const previewBody = modal.querySelector('.file-preview-body');
                  if (selectedFile.type === 'application/pdf') {
                    previewBody.innerHTML = `<embed src='${ev.target.result}' type='application/pdf' class='file-preview-embed' />`;
                  } else {
                    previewBody.innerHTML = `<img src='${ev.target.result}' class='file-preview-img' alt='קובץ' />`;
                  }
                  uploadRow.remove();
                  // Optionally show a success message
                };
                reader.readAsDataURL(selectedFile);
              };
            };
          };
        });
      } else {
        filesBox.style.display = 'none';
      }
    };
  }
});

// Helper to open the branch popup from details page
function ensurePopupCssLoaded() {
  const id = 'popup-css-link';
  let link = document.getElementById(id);
  if (link) {
    link.parentNode.removeChild(link);
  }
  link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'css/popup.css?v=' + Date.now(); // Force reload every time
  document.head.appendChild(link);
}

function openBranchPopupForDetails(branch, index) {
  ensurePopupCssLoaded();
  fetch('popup.html')
    .then(res => res.text())
    .then(html => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      document.body.appendChild(modalContainer);
      document.body.style.overflow = "hidden";

      const modal = document.getElementById("branchModal");
      modal.style.opacity = 0;
      setTimeout(() => { modal.style.transition = 'opacity 0.22s'; modal.style.opacity = 1; }, 10);

      const saveBtn = modal.querySelector('[data-save]');
      const cancelBtn = modal.querySelector('[data-cancel]');
      const closeBtn = modal.querySelector('.modal-close');
      const form = modal.querySelector("#branchForm");

      // Pre-fill form with branch data
      if (branch) {
        Object.entries(branch).forEach(([key, value]) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = value;
        });
      } else {
        form.reset();
      }

      function saveDataAndClose() {
        const inputs = form.querySelectorAll("input[name], select[name]");
        const data = {};
        inputs.forEach(input => {
          if (input.type === 'file') return;
          data[input.name] = input.value.trim();
        });
        // Keep attachments if present
        if (branch && branch.attachments) data.attachments = branch.attachments;
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
        // Update the details view immediately
        window.location.reload();
      }
      if (saveBtn) {
        saveBtn.addEventListener("click", saveDataAndClose);
      }
      if (cancelBtn) {
        cancelBtn.onclick = function() {
          if (modalContainer && modalContainer.parentNode) {
            modalContainer.parentNode.removeChild(modalContainer);
          }
          document.body.style.overflow = '';
        };
      }
      if (closeBtn) {
        closeBtn.onclick = function() {
          if (modalContainer && modalContainer.parentNode) {
            modalContainer.parentNode.removeChild(modalContainer);
          }
          document.body.style.overflow = '';
        };
      }
    });
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

// פונקציה ליצירת טבלת היסטוריית ביקורות עם תגים עגולים לכל הערכים
function renderReviewsTable(reviews) {
  const table = document.createElement('table');
  table.className = 'reviews-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>מבקר</th>
        <th>תאריך</th>
        <th>סוג ביקורת</th>
        <th>ציון סופי</th>
        <th>שם סניף</th>
        <th>הערות</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  reviews.forEach(r => {
    const typeName = (r.type || '').trim();
    const bgColor = stringToHslColor(typeName, 60, 85);
    const typeHtml = `<span class='badge' style="background: ${bgColor}; color: #1d1d1f;">${typeName}</span>`;
    const reviewerBadge = `<span class='badge date-soft'>${r.reviewer || '-'}</span>`;
    const dateBadge = `<span class='badge date-soft'>${r.date || '-'}</span>`;
    const branchNameBadge = `<span class='badge'>${r.branch || '-'}</span>`;
    const scoreClass = 'badge';
    const scoreHtml = `<span class="${scoreClass}">${(r.score || 0).toFixed(2)}/5</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${reviewerBadge}</td>
      <td>${dateBadge}</td>
      <td>${typeHtml}</td>
      <td class="score-cell"><span class="${scoreClass}">${score.toFixed(2)}/5</span></td>
      <td>${branchNameBadge}</td>
      <td>${r.comments || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  return table;
}
// דוגמה לשימוש: (יש להכניס את זה במקום בו נטענות הביקורות)
// const reviews = [...];
// const table = renderReviewsTable(reviews);
// document.querySelector('.reviews-history.card').appendChild(table); 