document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-edit');
  const listEl = document.getElementById('contacts-list');
  const searchInput = document.getElementById('search');

  let contacts = [];
  let editingId = null;

  function load() {
    const raw = localStorage.getItem('contacts');
    if (raw) {
      try { contacts = JSON.parse(raw) } catch (e) { contacts = [] }
    }
    render();
  }

  function save() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function render(filter = '') {
    listEl.innerHTML = '';

    let filtered = contacts.filter(c =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.email.toLowerCase().includes(filter.toLowerCase())
    );

    if (!filtered.length) {
      listEl.innerHTML = '<p class="empty">No contacts found.</p>';
      return;
    }

    filtered.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      card.draggable = true;
      card.dataset.id = contact.id;

      card.innerHTML = `
        <div class="info">
          <div><strong>${escapeHtml(contact.name)}</strong></div>
          <div>${escapeHtml(contact.email)}</div>
          <div>${escapeHtml(contact.phone)}</div>
        </div>
        <div class="actions">
          <button data-id="${contact.id}" class="edit">Edit</button>
          <button data-id="${contact.id}" class="delete">Delete</button>
        </div>
      `;

      addDragEvents(card);
      listEl.appendChild(card);
    });
  }

  function addDragEvents(card) {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      updateOrder();
    });
  }

  listEl.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(e.clientY);
    if (afterElement == null) {
      listEl.appendChild(dragging);
    } else {
      listEl.insertBefore(dragging, afterElement);
    }
  });

  function getDragAfterElement(y) {
    const elements = [...listEl.querySelectorAll('.contact-card:not(.dragging)')];

    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateOrder() {
    const ids = [...listEl.querySelectorAll('.contact-card')]
      .map(card => card.dataset.id);

    contacts.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    save();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !email || !phone) {
      alert('Name, email and phone are required.');
      return;
    }

    if (editingId) {
      const idx = contacts.findIndex(c => c.id === editingId);
      if (idx > -1) {
        contacts[idx] = { id: editingId, name, email, phone };
      }
      editingId = null;
      submitBtn.textContent = 'Add Contact';
      cancelBtn.classList.add('hidden');
    } else {
      const id = Date.now().toString();
      contacts.push({ id, name, email, phone });
    }

    save();
    render(searchInput.value);
    form.reset();
  });

  listEl.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    if (!id) return;

    if (e.target.matches('.delete')) {
      contacts = contacts.filter(c => c.id !== id);
      save();
      render(searchInput.value);
    }

    if (e.target.matches('.edit')) {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        editingId = id;
        nameInput.value = contact.name;
        emailInput.value = contact.email;
        phoneInput.value = contact.phone;
        submitBtn.textContent = 'Update Contact';
        cancelBtn.classList.remove('hidden');
      }
    }
  });

  cancelBtn.addEventListener('click', () => {
    editingId = null;
    form.reset();
    submitBtn.textContent = 'Add Contact';
    cancelBtn.classList.add('hidden');
  });

  searchInput.addEventListener('input', () => {
    render(searchInput.value);
  });

  load();
});