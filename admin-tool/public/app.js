const API_BASE = '';

// State
let cards = [];
let kinks = [];
let conversations = [];
let currentTab = 'cards';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCardsTab();
  initKinksTab();
  initConversationsTab();
  initGitActions();
  loadStats();
  loadCards();
});

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).classList.add('active');
  
  if (tab === 'cards') loadCards();
  if (tab === 'kinks') loadKinks();
  if (tab === 'conversations') loadConversations();
  if (tab === 'stats') loadStats();
}

// ===== CARDS =====

function initCardsTab() {
  document.getElementById('add-card-btn').addEventListener('click', () => openCardModal());
  document.getElementById('card-form').addEventListener('submit', saveCard);
  document.getElementById('card-type-filter').addEventListener('change', filterCards);
  document.getElementById('card-intensity-filter').addEventListener('change', filterCards);
  document.getElementById('card-premium-filter').addEventListener('change', filterCards);
  document.getElementById('card-search').addEventListener('input', filterCards);
  
  document.querySelector('#card-modal .close-btn').addEventListener('click', closeModal);
}

async function loadCards() {
  try {
    const res = await fetch(`${API_BASE}/api/cards`);
    const data = await res.json();
    if (data.success) {
      cards = data.data;
      renderCards(cards);
    }
  } catch (err) {
    showToast('Failed to load cards', 'error');
  }
}

function renderCards(cardsToRender) {
  const container = document.getElementById('cards-list');
  container.innerHTML = cardsToRender.map(card => `
    <div class="item-card" data-id="${card.id}">
      <div class="item-header">
        <span class="item-id">${card.id}</span>
        <div class="item-badges">
          <span class="badge badge-type-${card.type}">${card.type}</span>
          <span class="badge badge-intensity-${card.intensity}">Level ${card.intensity}</span>
          <span class="badge ${card.isPremium ? 'badge-premium' : 'badge-free'}">${card.isPremium ? 'Premium' : 'Free'}</span>
        </div>
      </div>
      <div class="item-content">${escapeHtml(card.content)}</div>
      <div class="item-meta">
        ${card.estimatedTime && card.estimatedTime !== 'N/A' ? `<span>⏱️ ${card.estimatedTime}</span>` : ''}
        <span>📂 ${card.category}</span>
        ${card.requires?.length ? `<span>🎭 ${card.requires.join(', ')}</span>` : ''}
        ${card.safetyNotes ? `<span>⚠️ Safety notes</span>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-secondary" onclick="editCard('${card.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteCard('${card.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function filterCards() {
  const type = document.getElementById('card-type-filter').value;
  const intensity = document.getElementById('card-intensity-filter').value;
  const premium = document.getElementById('card-premium-filter').value;
  const search = document.getElementById('card-search').value.toLowerCase();
  
  let filtered = cards;
  
  if (type) filtered = filtered.filter(c => c.type === type);
  if (intensity) filtered = filtered.filter(c => c.intensity === parseInt(intensity));
  if (premium) filtered = filtered.filter(c => String(c.isPremium) === premium);
  if (search) filtered = filtered.filter(c => c.content.toLowerCase().includes(search));
  
  renderCards(filtered);
}

function openCardModal(card = null) {
  const modal = document.getElementById('card-modal');
  const title = document.getElementById('card-modal-title');
  
  // Initialize time mode selector
  const timeModeSelect = document.getElementById('card-time-mode');
  const timeValueInput = document.getElementById('card-time-value');
  const timeUnitSelect = document.getElementById('card-time-unit');
  
  // Add change listener for time mode
  timeModeSelect.onchange = () => {
    const isTimed = timeModeSelect.value === 'timed';
    timeValueInput.disabled = !isTimed;
    timeUnitSelect.disabled = !isTimed;
    timeValueInput.style.opacity = isTimed ? '1' : '0.5';
    timeUnitSelect.style.opacity = isTimed ? '1' : '0.5';
  };
  
  if (card) {
    title.textContent = 'Edit Card';
    document.getElementById('card-id').value = card.id;
    document.getElementById('card-type').value = card.type;
    document.getElementById('card-intensity').value = card.intensity;
    document.getElementById('card-category').value = card.category;
    document.getElementById('card-premium').value = String(card.isPremium);
    document.getElementById('card-content').value = card.content;
    
    // Handle time display
    if (card.estimatedTime === 'N/A' || card.estimatedTime === '') {
      timeModeSelect.value = 'na';
      timeValueInput.disabled = true;
      timeUnitSelect.disabled = true;
      timeValueInput.style.opacity = '0.5';
      timeUnitSelect.style.opacity = '0.5';
    } else {
      const timeMatch = card.estimatedTime.match(/(\d+)\s*(sec|min|hour)/);
      if (timeMatch) {
        timeModeSelect.value = 'timed';
        timeValueInput.value = timeMatch[1];
        timeUnitSelect.value = timeMatch[2];
        timeValueInput.disabled = false;
        timeUnitSelect.disabled = false;
        timeValueInput.style.opacity = '1';
        timeUnitSelect.style.opacity = '1';
      }
    }
    
    document.getElementById('card-requires').value = card.requires?.join(', ') || '';
    document.getElementById('card-safety').value = card.safetyNotes || '';
  } else {
    title.textContent = 'Add New Card';
    document.getElementById('card-form').reset();
    document.getElementById('card-id').value = '';
    timeModeSelect.value = 'timed';
    timeValueInput.disabled = false;
    timeUnitSelect.disabled = false;
    timeValueInput.style.opacity = '1';
    timeUnitSelect.style.opacity = '1';
  }
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('card-modal').classList.remove('active');
}

async function editCard(id) {
  const card = cards.find(c => c.id === id);
  if (card) openCardModal(card);
}

async function saveCard(e) {
  e.preventDefault();
  
  const id = document.getElementById('card-id').value;
  const timeMode = document.getElementById('card-time-mode').value;
  
  let estimatedTime;
  if (timeMode === 'na') {
    estimatedTime = 'N/A';
  } else {
    const timeValue = document.getElementById('card-time-value').value;
    const timeUnit = document.getElementById('card-time-unit').value;
    estimatedTime = `${timeValue} ${timeUnit}`;
  }
  
  const cardData = {
    type: document.getElementById('card-type').value,
    intensity: parseInt(document.getElementById('card-intensity').value),
    category: document.getElementById('card-category').value,
    isPremium: document.getElementById('card-premium').value === 'true',
    content: document.getElementById('card-content').value,
    estimatedTime: estimatedTime,
    requires: document.getElementById('card-requires').value.split(',').map(s => s.trim()).filter(Boolean),
    safetyNotes: document.getElementById('card-safety').value
  };
  
  try {
    const url = id ? `${API_BASE}/api/cards/${id}` : `${API_BASE}/api/cards`;
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Card updated' : 'Card created', 'success');
      closeModal();
      // Reload cards but preserve filters
      await loadCards();
      filterCards();
    } else {
      showToast(data.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Failed to save card', 'error');
  }
}

async function deleteCard(id) {
  if (!confirm('Are you sure you want to delete this card?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/cards/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Card deleted', 'success');
      // Reload cards but preserve filters
      await loadCards();
      filterCards();
    } else {
      showToast(data.error || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Failed to delete card', 'error');
  }
}

// ===== KINKS =====

function initKinksTab() {
  document.getElementById('add-kink-btn').addEventListener('click', () => openKinkModal());
  document.getElementById('kink-form').addEventListener('submit', saveKink);
  document.getElementById('kink-lang-filter').addEventListener('change', loadKinks);
  document.getElementById('kink-tier-filter').addEventListener('change', filterKinks);
  document.getElementById('kink-search').addEventListener('input', filterKinks);
  
  document.querySelector('#kink-modal .close-btn').addEventListener('click', closeKinkModal);
}

async function loadKinks() {
  const lang = document.getElementById('kink-lang-filter').value;
  try {
    const res = await fetch(`${API_BASE}/api/kinks?lang=${lang}`);
    const data = await res.json();
    if (data.success) {
      kinks = data.data;
      renderKinks(kinks);
    }
  } catch (err) {
    showToast('Failed to load kinks', 'error');
  }
}

function renderKinks(kinksToRender) {
  const container = document.getElementById('kinks-list');
  container.innerHTML = kinksToRender.map(kink => `
    <div class="item-card" data-id="${kink.id}">
      <div class="item-header">
        <span class="item-id">${kink.id}</span>
        <div class="item-badges">
          <span class="badge badge-intensity-${kink.intensityScale}">Intensity ${kink.intensityScale}</span>
          <span class="badge badge-type-${kink.tier}">${kink.tier}</span>
        </div>
      </div>
      <div class="item-content">
        <strong>${escapeHtml(kink.title)}</strong>
        <p style="margin-top: 10px; color: var(--text-secondary);">${escapeHtml(kink.description)}</p>
      </div>
      <div class="item-meta">
        <span>📂 ${kink.category}</span>
        <span>🏷️ ${kink.tags?.join(', ') || 'No tags'}</span>
      </div>
      <div class="item-actions">
        <button class="btn-secondary" onclick="editKink('${kink.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteKink('${kink.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function filterKinks() {
  const tier = document.getElementById('kink-tier-filter').value;
  const search = document.getElementById('kink-search').value.toLowerCase();
  
  let filtered = kinks;
  
  if (tier) filtered = filtered.filter(k => k.tier === tier);
  if (search) filtered = filtered.filter(k => 
    k.title.toLowerCase().includes(search) || 
    k.description.toLowerCase().includes(search)
  );
  
  renderKinks(filtered);
}

function openKinkModal(kink = null) {
  const modal = document.getElementById('kink-modal');
  const title = document.getElementById('kink-modal-title');
  
  if (kink) {
    title.textContent = 'Edit Kink';
    document.getElementById('kink-id').value = kink.id;
    document.getElementById('kink-title').value = kink.title;
    document.getElementById('kink-title-es').value = kink.titleEs || '';
    document.getElementById('kink-description').value = kink.description;
    document.getElementById('kink-description-es').value = kink.descriptionEs || '';
    document.getElementById('kink-category').value = kink.category;
    document.getElementById('kink-intensity').value = kink.intensityScale;
    document.getElementById('kink-tier').value = kink.tier;
    document.getElementById('kink-tags').value = kink.tags?.join(', ') || '';
  } else {
    title.textContent = 'Add New Kink';
    document.getElementById('kink-form').reset();
    document.getElementById('kink-id').value = '';
  }
  
  modal.classList.add('active');
}

function closeKinkModal() {
  document.getElementById('kink-modal').classList.remove('active');
}

async function editKink(id) {
  const kink = kinks.find(k => k.id === id);
  if (kink) openKinkModal(kink);
}

async function saveKink(e) {
  e.preventDefault();
  
  const id = document.getElementById('kink-id').value;
  const lang = document.getElementById('kink-lang-filter').value;
  
  const kinkData = {
    title: document.getElementById('kink-title').value,
    titleEs: document.getElementById('kink-title-es').value,
    description: document.getElementById('kink-description').value,
    descriptionEs: document.getElementById('kink-description-es').value,
    category: document.getElementById('kink-category').value,
    intensityScale: parseInt(document.getElementById('kink-intensity').value),
    tier: document.getElementById('kink-tier').value,
    tags: document.getElementById('kink-tags').value.split(',').map(s => s.trim()).filter(Boolean)
  };
  
  try {
    const url = id ? `${API_BASE}/api/kinks/${id}?lang=${lang}` : `${API_BASE}/api/kinks?lang=${lang}`;
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kinkData)
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Kink updated' : 'Kink created', 'success');
      closeKinkModal();
      // Reload kinks but preserve filters
      await loadKinks();
      filterKinks();
    } else {
      showToast(data.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Failed to save kink', 'error');
  }
}

async function deleteKink(id) {
  if (!confirm('Are you sure you want to delete this kink?')) return;
  
  const lang = document.getElementById('kink-lang-filter').value;
  
  try {
    const res = await fetch(`${API_BASE}/api/kinks/${id}?lang=${lang}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Kink deleted', 'success');
      // Reload kinks but preserve filters
      await loadKinks();
      filterKinks();
    } else {
      showToast(data.error || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Failed to delete kink', 'error');
  }
}

// ===== CONVERSATIONS =====

function initConversationsTab() {
  document.getElementById('add-conv-btn').addEventListener('click', () => openConvModal());
  document.getElementById('conv-form').addEventListener('submit', saveConv);
  document.getElementById('conv-lang-filter').addEventListener('change', loadConversations);
  document.getElementById('conv-category-filter').addEventListener('change', filterConversations);
  document.getElementById('conv-intensity-filter').addEventListener('change', filterConversations);
  document.getElementById('conv-search').addEventListener('input', filterConversations);
  
  document.querySelector('#conv-modal .close-btn').addEventListener('click', closeConvModal);
}

async function loadConversations() {
  const lang = document.getElementById('conv-lang-filter').value;
  try {
    const res = await fetch(`${API_BASE}/api/conversations?lang=${lang}`);
    const data = await res.json();
    if (data.success) {
      conversations = data.data;
      renderConversations(conversations);
    }
  } catch (err) {
    showToast('Failed to load conversation starters', 'error');
  }
}

function renderConversations(convs) {
  const container = document.getElementById('conversations-list');
  if (convs.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No conversation starters found</p>';
    return;
  }
  container.innerHTML = convs.map(conv => `
    <div class="item-card" data-id="${conv.id}">
      <div class="item-header">
        <span class="item-id">${conv.id}</span>
        <div class="item-badges">
          <span class="badge badge-intensity-${conv.intensity}">Level ${conv.intensity}</span>
          <span class="badge badge-type-${conv.category}">${conv.category.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div class="item-content">${escapeHtml(conv.question)}</div>
      ${conv.context ? `<p style="margin-top: 10px; color: var(--text-secondary); font-size: 13px;">${escapeHtml(conv.context)}</p>` : ''}
      <div class="item-meta">
        ${conv.followUps?.length ? `<span>💬 ${conv.followUps.length} follow-ups</span>` : ''}
        ${conv.tags?.length ? `<span>🏷️ ${conv.tags.join(', ')}</span>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-secondary" onclick="editConv('${conv.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteConv('${conv.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function filterConversations() {
  const category = document.getElementById('conv-category-filter').value;
  const intensity = document.getElementById('conv-intensity-filter').value;
  const search = document.getElementById('conv-search').value.toLowerCase();
  
  let filtered = conversations;
  
  if (category) filtered = filtered.filter(c => c.category === category);
  if (intensity) filtered = filtered.filter(c => c.intensity === parseInt(intensity));
  if (search) filtered = filtered.filter(c => c.question.toLowerCase().includes(search));
  
  renderConversations(filtered);
}

function openConvModal(conv = null) {
  const modal = document.getElementById('conv-modal');
  const title = document.getElementById('conv-modal-title');
  
  if (conv) {
    title.textContent = 'Edit Conversation Starter';
    document.getElementById('conv-id').value = conv.id;
    document.getElementById('conv-category').value = conv.category;
    document.getElementById('conv-intensity').value = conv.intensity;
    document.getElementById('conv-question').value = conv.question;
    document.getElementById('conv-followups').value = conv.followUps?.join('\n') || '';
    document.getElementById('conv-context').value = conv.context || '';
    document.getElementById('conv-tags').value = conv.tags?.join(', ') || '';
  } else {
    title.textContent = 'Add New Conversation Starter';
    document.getElementById('conv-form').reset();
    document.getElementById('conv-id').value = '';
  }
  
  modal.classList.add('active');
}

function closeConvModal() {
  document.getElementById('conv-modal').classList.remove('active');
}

async function editConv(id) {
  const conv = conversations.find(c => c.id === id);
  if (conv) openConvModal(conv);
}

async function saveConv(e) {
  e.preventDefault();
  
  const id = document.getElementById('conv-id').value;
  const lang = document.getElementById('conv-lang-filter').value;
  
  const convData = {
    category: document.getElementById('conv-category').value,
    intensity: parseInt(document.getElementById('conv-intensity').value),
    question: document.getElementById('conv-question').value,
    followUps: document.getElementById('conv-followups').value.split('\n').map(s => s.trim()).filter(Boolean),
    context: document.getElementById('conv-context').value,
    tags: document.getElementById('conv-tags').value.split(',').map(s => s.trim()).filter(Boolean)
  };
  
  try {
    const url = id ? `${API_BASE}/api/conversations/${id}?lang=${lang}` : `${API_BASE}/api/conversations?lang=${lang}`;
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convData)
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Conversation starter updated' : 'Conversation starter created', 'success');
      closeConvModal();
      await loadConversations();
      filterConversations();
    } else {
      showToast(data.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Failed to save conversation starter', 'error');
  }
}

async function deleteConv(id) {
  if (!confirm('Are you sure you want to delete this conversation starter?')) return;
  
  const lang = document.getElementById('conv-lang-filter').value;
  
  try {
    const res = await fetch(`${API_BASE}/api/conversations/${id}?lang=${lang}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Conversation starter deleted', 'success');
      await loadConversations();
      filterConversations();
    } else {
      showToast(data.error || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Failed to delete conversation starter', 'error');
  }
}

// ===== GIT =====

function initGitActions() {
  document.getElementById('git-status-btn').addEventListener('click', showGitStatus);
  document.getElementById('commit-btn').addEventListener('click', openCommitModal);
  document.getElementById('commit-form').addEventListener('submit', doCommit);
  document.querySelector('#commit-modal .close-btn').addEventListener('click', closeCommitModal);
}

async function showGitStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/git/status`);
    const data = await res.json();
    alert(data.status || 'No changes');
  } catch (err) {
    showToast('Failed to get git status', 'error');
  }
}

function openCommitModal() {
  document.getElementById('commit-modal').classList.add('active');
  showGitStatusInModal();
}

function closeCommitModal() {
  document.getElementById('commit-modal').classList.remove('active');
}

async function showGitStatusInModal() {
  try {
    const res = await fetch(`${API_BASE}/api/git/status`);
    const data = await res.json();
    document.getElementById('git-status-display').textContent = data.status || 'No changes to commit';
  } catch (err) {
    document.getElementById('git-status-display').textContent = 'Error fetching status';
  }
}

async function doCommit(e) {
  e.preventDefault();
  
  const message = document.getElementById('commit-message').value;
  
  try {
    const res = await fetch(`${API_BASE}/api/git/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await res.json();
    if (data.success) {
      showToast('Changes committed and pushed!', 'success');
      closeCommitModal();
    } else {
      showToast(data.error || 'Failed to commit', 'error');
    }
  } catch (err) {
    showToast('Failed to commit changes', 'error');
  }
}

// ===== STATS =====

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    const data = await res.json();
    if (data.success) {
      renderStats(data.data);
    }
  } catch (err) {
    showToast('Failed to load stats', 'error');
  }
}

function renderStats(stats) {
  const container = document.getElementById('stats-content');
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Cards</h3>
        <div class="stat-value">${stats.cards.total}</div>
        <div class="stat-breakdown">
          <div class="stat-row"><span>Free</span><span>${stats.cards.free}</span></div>
          <div class="stat-row"><span>Premium</span><span>${stats.cards.premium}</span></div>
        </div>
      </div>
      
      <div class="stat-card">
        <h3>Cards by Type</h3>
        <div class="stat-value">${Object.keys(stats.cards.byType).length}</div>
        <div class="stat-breakdown">
          ${Object.entries(stats.cards.byType).map(([type, count]) => `
            <div class="stat-row"><span>${type}</span><span>${count}</span></div>
          `).join('')}
        </div>
      </div>
      
      <div class="stat-card">
        <h3>Cards by Intensity</h3>
        <div class="stat-value">5</div>
        <div class="stat-breakdown">
          ${Object.entries(stats.cards.byIntensity).map(([level, count]) => `
            <div class="stat-row"><span>Level ${level}</span><span>${count}</span></div>
          `).join('')}
        </div>
      </div>
      
      <div class="stat-card">
        <h3>Safety & Props</h3>
        <div class="stat-value">${stats.cards.withSafetyNotes}</div>
        <div class="stat-breakdown">
          <div class="stat-row"><span>With Safety Notes</span><span>${stats.cards.withSafetyNotes}</span></div>
          <div class="stat-row"><span>With Toy Requirements</span><span>${stats.cards.withRequires}</span></div>
        </div>
      </div>
      
      <div class="stat-card">
        <h3>Kinks</h3>
        <div class="stat-value">${stats.kinks.en + stats.kinks.es}</div>
        <div class="stat-breakdown">
          <div class="stat-row"><span>English</span><span>${stats.kinks.en}</span></div>
          <div class="stat-row"><span>Spanish</span><span>${stats.kinks.es}</span></div>
        </div>
      </div>
    </div>
  `;
}

// ===== UTILS =====

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}