document.addEventListener("DOMContentLoaded", function() {
  updateDashboardStats();
  updateRecentReviews();
});

function updateDashboardStats() {
  // Update active branches count
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const activeCount = branches.filter(b => b.status === "פעיל").length;
  
  // Update reviews completed count
  const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  const reviewsCount = reviews.length;
  
  // Update the stats cards
  document.querySelectorAll(".stat-card").forEach(card => {
    const title = card.querySelector(".stat-title")?.innerText?.trim();
    const valueElement = card.querySelector(".stat-value");
    
    if (title === "סניפים פעילים") {
      valueElement.innerText = activeCount;
    } else if (title === "ביקורות שבוצעו") {
      valueElement.innerText = reviewsCount;
    }
  });
  
  // Update top performing and needs improvement branches
  updateBranchPerformanceStats(reviews, branches);
}

function updateBranchPerformanceStats(reviews, branches) {
  if (reviews.length === 0) {
    return; // No reviews to analyze
  }
  
  // Group reviews by branch and calculate average scores
  const branchScores = {};
  reviews.forEach(review => {
    if (review.branch && review.score) {
      if (!branchScores[review.branch]) {
        branchScores[review.branch] = { total: 0, count: 0 };
      }
      branchScores[review.branch].total += review.score;
      branchScores[review.branch].count += 1;
    }
  });
  
  // Calculate averages and find top/bottom performers
  const branchAverages = Object.keys(branchScores).map(branch => ({
    name: branch,
    average: branchScores[branch].total / branchScores[branch].count
  }));
  
  if (branchAverages.length > 0) {
    // Sort by average score
    branchAverages.sort((a, b) => b.average - a.average);
    
    const topPerformer = branchAverages[0];
    const needsImprovement = branchAverages[branchAverages.length - 1];
    
    // Update the stats cards
    document.querySelectorAll(".stat-card").forEach(card => {
      const title = card.querySelector(".stat-title")?.innerText?.trim();
      const valueElement = card.querySelector(".stat-value");
      
      if (title === "סניף מצטיין") {
        valueElement.innerText = topPerformer.name;
      } else if (title === "סניף דורש שיפור") {
        valueElement.innerText = needsImprovement.name;
      }
    });
  }
}

function updateRecentReviews() {
  const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  const recentReviewsContainer = document.querySelector('.box:last-child');
  
  if (reviews.length === 0) {
    recentReviewsContainer.innerHTML = `
      <div class="section-title">ביקורות אחרונות</div>
      <div class="list-empty">לא קיימות ביקורות להצגה כרגע.</div>
    `;
    return;
  }
  
  // Sort reviews by date (most recent first)
  const sortedReviews = reviews.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  
  // Take the 5 most recent reviews
  const recentReviews = sortedReviews.slice(0, 5);
  
  // Create the HTML for recent reviews with table structure
  let reviewsHTML = `
    <div class="section-title">ביקורות אחרונות</div>
    <div class="recent-reviews-table" style="
      width: 100%;
      border-collapse: collapse;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    ">
  `;
  
  // Add table header
  reviewsHTML += `
    <div style="
      background-color: #f7f7f7;
      padding: 12px 16px;
      font-weight: bold;
      color: #333;
      border-bottom: 1px solid #eee;
      display: grid;
      grid-template-columns: 1fr 80px 100px;
      gap: 16px;
      align-items: center;
    ">
      <div>פרטי הביקורת</div>
      <div style="text-align: center;">ציון</div>
      <div style="text-align: center;">תאריך</div>
    </div>
  `;
  
  // Add review rows
  recentReviews.forEach((review, index) => {
    const reviewDate = new Date(review.date);
    const formattedDate = reviewDate.toLocaleDateString('he-IL');
    
    // Determine score color
    let scoreColor = "green";
    if (review.score <= 3) scoreColor = "red";
    else if (review.score <= 7) scoreColor = "yellow";
    
    // Determine type color
    let typeColor = "lightgreen";
    if (review.type?.includes("משלוח")) typeColor = "yellow";
    else if (review.type?.includes("ראיון")) typeColor = "pink";
    
    reviewsHTML += `
      <div class="recent-review-row" 
           data-review-index="${sortedReviews.indexOf(review)}"
           style="
             padding: 12px 16px;
             border-bottom: 1px solid #eee;
             display: grid;
             grid-template-columns: 1fr 80px 100px;
             gap: 16px;
             align-items: center;
             cursor: pointer;
             transition: background-color 0.2s ease;
           "
           onmouseover="this.style.backgroundColor='#f8f9fa'"
           onmouseout="this.style.backgroundColor='#fff'"
           onclick="viewReviewDetails(${sortedReviews.indexOf(review)})">
        <div>
          <div style="font-weight: bold; color: #333; margin-bottom: 4px;">
            ${review.branch || 'סניף לא מוגדר'}
          </div>
          <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
            ${review.type || 'סוג לא מוגדר'} - ${review.reviewer || 'מבקר לא מוגדר'}
          </div>
          <span class="badge ${typeColor}" style="
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            background-color: ${typeColor === 'lightgreen' ? '#e0f7fa' : typeColor === 'yellow' ? '#fff7cc' : '#ffe0f0'};
            color: ${typeColor === 'lightgreen' ? '#00695c' : typeColor === 'yellow' ? '#c79b00' : '#c2185b'};
          ">${review.type || 'לא מוגדר'}</span>
        </div>
        <div style="text-align: center;">
          <span class="badge ${scoreColor}" style="
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            background-color: ${scoreColor === 'green' ? '#e0f8e9' : scoreColor === 'yellow' ? '#fff7cc' : '#fdecea'};
            color: ${scoreColor === 'green' ? '#2e7d32' : scoreColor === 'yellow' ? '#c79b00' : '#d32f2f'};
          ">${review.score || 0}/10</span>
        </div>
        <div style="text-align: center; font-size: 13px; color: #666;">
          ${formattedDate}
        </div>
      </div>
    `;
  });
  
  reviewsHTML += '</div>';
  
  // Add "View All" link if there are more than 5 reviews
  if (reviews.length > 5) {
    reviewsHTML += `
      <div style="text-align: center; margin-top: 15px;">
        <a href="reviews.html" style="
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
          padding: 8px 16px;
          border: 1px solid #007bff;
          border-radius: 6px;
          transition: all 0.2s ease;
        " onmouseover="this.style.backgroundColor='#007bff'; this.style.color='white'" 
           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#007bff'">
          צפה בכל הביקורות (${reviews.length})
        </a>
      </div>
    `;
  }
  
  recentReviewsContainer.innerHTML = reviewsHTML;
}

// Function to handle review row clicks
function viewReviewDetails(reviewIndex) {
  const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  const review = reviews[reviewIndex];
  
  if (review) {
    // Store the review data for the view page
    localStorage.setItem('currentReview', JSON.stringify(review));
    localStorage.setItem('currentReviewIndex', reviewIndex);
    
    // Redirect to review view page (to be created later)
    window.location.href = 'review-view.html';
  }
}

// Update branch rankings section
function updateBranchRankings() {
  const reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
  const branchesContainer = document.querySelector('.box:first-child');
  
  if (reviews.length === 0) {
    branchesContainer.innerHTML = `
      <div class="section-title">דירוג סניפים (ציון ממוצע)</div>
      <div class="list-empty">אין נתונים להצגה</div>
    `;
    return;
  }
  
  // Group reviews by branch and calculate average scores
  const branchScores = {};
  reviews.forEach(review => {
    if (review.branch && review.score) {
      if (!branchScores[review.branch]) {
        branchScores[review.branch] = { total: 0, count: 0 };
      }
      branchScores[review.branch].total += review.score;
      branchScores[review.branch].count += 1;
    }
  });
  
  // Calculate averages and sort
  const branchAverages = Object.keys(branchScores).map(branch => ({
    name: branch,
    average: Math.round((branchScores[branch].total / branchScores[branch].count) * 10) / 10
  }));
  
  branchAverages.sort((a, b) => b.average - a.average);
  
  // Create the HTML for branch rankings
  let rankingsHTML = '<div class="section-title">דירוג סניפים (ציון ממוצע)</div>';
  
  branchAverages.forEach((branch, index) => {
    const rank = index + 1;
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    
    rankingsHTML += `
      <div class="branch-ranking-item" style="
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${rankIcon}</span>
          <span style="font-weight: bold; color: #333;">${branch.name}</span>
        </div>
        <div style="
          background: ${branch.average >= 8 ? '#28a745' : branch.average >= 6 ? '#ffc107' : '#dc3545'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
        ">
          ${branch.average}/10
        </div>
      </div>
    `;
  });
  
  branchesContainer.innerHTML = rankingsHTML;
}

// Call all update functions
function updateDashboard() {
  updateDashboardStats();
  updateRecentReviews();
  updateBranchRankings();
}

// Update dashboard when page loads
updateDashboard(); 