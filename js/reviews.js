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

  // הגדרת צבעים רכים לסוגי ביקורת (דינאמי לפי שם)
  // (אין צורך ב-typeMap יותר)
  const colorClasses = [
    "badge review-type-mystery", // ורוד/אדום
    "badge review-type-service", // סגול/כחול בהיר
    "badge review-type-clean",   // צהוב/ירוק בהיר
    "badge review-type-safety",  // כתום/צהוב
    "badge review-type-other"    // סגול בהיר
  ];
  // מיפוי אחיד של שמות סוגי ביקורת לסלאג צבע אחיד (כמו בכל העמודים)
  const typeMap = {
    'לקוח סמוי': 'mystery',
    'Mystery Shopper': 'mystery',
    'בדיקת ניקיון': 'clean',
    'Cleanliness Check': 'clean',
    'בדיקת שירות': 'service',
    'Service Quality': 'service',
    'בדיקת בטיחות': 'safety',
    'Safety Check': 'safety',
    // אפשר להוסיף עוד שמות
  };
  // מערך כל הסוגים שמופיעים בפועל (לפי סדר הופעה)
  const allTypes = Array.from(new Set(reviews.map(r => (r.type || '').trim())));

  // Use the same card-like badge for reviewer, branch, and date columns
  const reviewerBadgeClass = 'badge gray';
  const branchBadgeClass = 'badge primary';
  const dateBadgeClass = 'badge date-soft';

  function formatDate(dateStr) {
    if (!dateStr) return '';
    // Try to parse YYYY-MM-DD or similar
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    }
    // fallback: return as is
    return dateStr;
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

  function renderTable(filteredReviews) {
    tableBody.innerHTML = "";
    reviewCount.textContent = filteredReviews.length;

    filteredReviews.forEach((review, index) => {
      const row = document.createElement("tr");

      // Use new scoring system
      const score = review.averageScore || review.score || 0;
      const answeredQuestions = review.answeredQuestions || 0;
      const totalQuestions = review.totalQuestions || 0;
      // Score badge color (אחיד ללוח בקרה)
      let scoreClass = "badge score-high";
      if (score < 3) scoreClass = "badge score-low";
      else if (score < 4) scoreClass = "badge score-medium";
      // Review type badge color (דינאמי, רך, אחיד בכל האתר)
      const typeName = (review.type || '').trim();
      const bgColor = stringToHslColor(typeName, 60, 85);
      const typeClass = 'badge';
      console.log('Review type:', review.type, '=> typeClass:', typeClass);

      const reviewer = review.reviewer || '';
      const branch = review.branch || '';
      const formattedDate = formatDate(review.date);

      // RTL column order: Date | Branch | Review Type | Reviewer | Score | Actions
      row.innerHTML = `
        <td data-label="תאריך"><span class="${dateBadgeClass}"><span class="calendar-icon">📅</span> ${formattedDate}</span></td>
        <td data-label="סניף"><span class="badge primary">${branch}</span></td>
        <td data-label="סוג ביקורת"><span class="badge" style="background: ${bgColor}; color: #1d1d1f;">${typeName}</span></td>
        <td data-label="מבקר"><span class="badge gray">${reviewer}</span></td>
        <td data-label="ציון">
          <span class="${scoreClass}">${score.toFixed(1)}/5</span>
          <div class="score-details" style="font-size: 11px; color: #666; margin-top: 2px;">
            ${answeredQuestions}/${totalQuestions} שאלות
          </div>
        </td>
        <td data-label="פעולות" class="action-btns">
          <button class="btn btn-icon btn-view view" data-index="${index}" title="צפייה">👁️ צפייה</button>
          <button class="btn btn-icon btn-edit edit" data-index="${index}" title="עריכה">✏️ עריכה</button>
          <button class="btn btn-icon btn-delete delete" data-index="${index}" title="מחיקה">🗑️ מחיקה</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listeners for action buttons with small delay to ensure CSS is applied
    setTimeout(() => {
      addActionButtonListeners();
    }, 10);
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
        // Redirect to edit review page
        window.location.href = 'edit-review.html';
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
      // Free text search: match title, branch, or type
      const matchesSearch = !search ||
        (r.title && r.title.toLowerCase().includes(search)) ||
        (r.branch && r.branch.toLowerCase().includes(search)) ||
        (r.type && r.type.toLowerCase().includes(search));
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
