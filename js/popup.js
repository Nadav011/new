
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('branchModal');
  const saveBtn = modal.querySelector('[data-save]');
  const cancelBtn = modal.querySelector('[data-cancel]');
  const form = document.getElementById('branchForm');

  // פונקציה לפתיחת מודאל עם נתונים (לעריכה)
  window.openBranchModal = function (data = null, index = null) {
    modal.style.display = 'flex';
    form.reset();
    form.setAttribute('data-edit-index', index !== null ? index : '');

    if (data) {
      Object.keys(data).forEach(key => {
        if (form.elements[key]) {
          form.elements[key].value = data[key];
        }
      });
    }
  }

  // פונקציה לסגירה
  function closeModal() {
    modal.style.display = 'none';
    form.removeAttribute('data-edit-index');
  }

  cancelBtn.addEventListener('click', closeModal);

  // חיווי על שדות ריקים
  function highlightInvalidFields() {
    let isValid = true;
    form.querySelectorAll('[required]').forEach(el => {
      if (!el.value.trim()) {
        el.style.borderColor = 'red';
        isValid = false;
      } else {
        el.style.borderColor = '#ccc';
      }
    });
    return isValid;
  }

  // שמירה ללוקלסטורג'
  saveBtn.addEventListener('click', function () {
    if (!highlightInvalidFields()) return;

    const formData = {};
    Array.from(form.elements).forEach(el => {
      if (el.name && el.type !== 'file') {
        formData[el.name] = el.value.trim();
      }
    });

    let branches = JSON.parse(localStorage.getItem('branches') || '[]');
    const editIndex = form.getAttribute('data-edit-index');

    if (editIndex) {
      branches[editIndex] = formData;
    } else {
      branches.push(formData);
    }

    localStorage.setItem('branches', JSON.stringify(branches));
    closeModal();
    location.reload(); // לטעון מחדש את הדף לצפייה בשינויים
  });
});
