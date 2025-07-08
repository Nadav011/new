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
    statBoxes[3].textContent = branchReviews.length; // Total reviews
    if (branchReviews.length > 0) {
      const scores = branchReviews.map(r => typeof r.averageScore === 'number' ? r.averageScore : (r.score || 0));
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      statBoxes[0].textContent = min.toFixed(1);
      statBoxes[1].textContent = max.toFixed(1);
      statBoxes[2].textContent = avg.toFixed(2);
    } else {
      statBoxes[0].textContent = '0';
      statBoxes[1].textContent = '0';
      statBoxes[2].textContent = '0';
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
      tr.innerHTML = `
        <td>${r.reviewer || '-'}</td>
        <td>${r.date || '-'}</td>
        <td>${r.type || '-'}</td>
        <td>${score.toFixed(2)}/5</td>
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

// Helper to open the branch popup from details page
function openBranchPopupForDetails(branch, index) {
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
        cancelBtn.addEventListener("click", closeModal);
      }
    });
} 