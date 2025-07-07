document.addEventListener("DOMContentLoaded", () => {
  const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");

  const container = document.getElementById("reviews-container");
  const tableBody = document.getElementById("reviews-table-body");
  const searchInput = document.getElementById("search-input");
  const typeFilter = document.getElementById("type-filter");
  const branchFilter = document.getElementById("branch-filter");
  const reviewCount = document.getElementById("review-count");

  // Add click handler for "Add Review" button
  const addReviewBtn = document.querySelector(".add-btn");
  if (addReviewBtn) {
    addReviewBtn.addEventListener("click", () => {
      window.location.href = "add-review.html";
    });
  }

  // טען סניפים מ-localStorage
  const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  const branchNames = [...new Set(storedBranches.map(b => b.name))];
  branchNames.forEach(branch => {
    const option = document.createElement("option");
    option.textContent = branch;
    branchFilter.appendChild(option);
  });

  // סוגי ביקורות – נבנה רק מתוך ביקורות קיימות
  const typeSet = new Set();
  reviews.forEach(r => {
    if (r.type) typeSet.add(r.type);
  });
  [...typeSet].forEach(type => {
    const option = document.createElement("option");
    option.textContent = type;
    typeFilter.appendChild(option);
  });

  function renderTable(filteredReviews) {
    tableBody.innerHTML = "";
    reviewCount.textContent = filteredReviews.length;

    filteredReviews.forEach((review, index) => {
      const row = document.createElement("tr");

      let scoreColor = "green";
      if (review.score <= 3) scoreColor = "red";
      else if (review.score <= 7) scoreColor = "yellow";

      let typeColor = "lightgreen";
      if (review.type?.includes("משלוח")) typeColor = "yellow";
      else if (review.type?.includes("ראיון")) typeColor = "pink";

      // RTL column order: Date | Branch | Review Type | Reviewer | Score | Actions
      row.innerHTML = `
        <td>${review.date || ''}<br><span class="calendar-icon">📅 ${review.day || ''}</span></td>
        <td>
          <div class="branch-name">${review.branch || ''}</div>
          <div class="branch-sub">${review.city || ''}</div>
        </td>
        <td><span class="badge ${typeColor}">${review.type || ''}</span></td>
        <td>${review.reviewer || ''}</td>
        <td><span class="badge ${scoreColor}">${review.score || 0}/10</span></td>
        <td class="actions">
          <button class="btn btn-icon btn-view view" data-index="${index}">👁️ צפייה</button>
          <button class="btn btn-icon btn-edit edit" data-index="${index}">✏️ עריכה</button>
          <button class="btn btn-icon btn-delete delete" data-index="${index}">🗑️ מחיקה</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listeners for action buttons
    addActionButtonListeners();
  }

  function addActionButtonListeners() {
    // View button - redirect to review-view.html
    document.querySelectorAll('.view').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
        const review = reviews[index];
        
        // Store the review data for the view page
        localStorage.setItem('currentReview', JSON.stringify(review));
        localStorage.setItem('currentReviewIndex', index);
        
        // Redirect to review view page
        window.location.href = 'review-view.html';
      });
    });

    // Edit button - redirect to review-edit.html
    document.querySelectorAll('.edit').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
        const review = reviews[index];
        
        // Store the review data for the edit page
        localStorage.setItem('currentReview', JSON.stringify(review));
        localStorage.setItem('currentReviewIndex', index);
        
        // Redirect to review edit page
        window.location.href = 'review-edit.html';
      });
    });

    // Delete button - remove from DOM and localStorage
    document.querySelectorAll('.delete').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        
        if (confirm('האם אתה בטוח שברצונך למחוק ביקורת זו?')) {
          // Remove from localStorage
          const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
          reviews.splice(index, 1);
          localStorage.setItem("reviews", JSON.stringify(reviews));
          
          // Re-render the table to update the display
          renderTable(reviews);
          
          // Update the review count
          document.getElementById("review-count").textContent = reviews.length;
        }
      });
    });
  }

  function filterReviews() {
    const search = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value.trim();
    const selectedBranch = branchFilter.value.trim();

    const filtered = reviews.filter(r => {
      const matchesSearch = !search || (r.title && r.title.toLowerCase().includes(search));
      const matchesType = selectedType === "כל הסוגים" || (r.type && r.type.trim() === selectedType);
      const matchesBranch = selectedBranch === "כל הסניפים" || (r.branch && r.branch.trim() === selectedBranch);
      return matchesSearch && matchesType && matchesBranch;
    });

    renderTable(filtered);
  }

  searchInput.addEventListener("input", filterReviews);
  typeFilter.addEventListener("change", filterReviews);
  branchFilter.addEventListener("change", filterReviews);

  renderTable(reviews);
});
