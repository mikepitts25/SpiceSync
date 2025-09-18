// tools/kink-studio/public/app.js
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    lang: 'en',
    all: [],
    filtered: [],
    page: 1,
    pagesize: 50,
    selectedIndex: -1, // index in filtered
    dirty: false,
  };

  // Utilities
  const pad4 = (n) => String(n).padStart(4, '0');
  const slugify = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const STEP_SUFFIX = /\s*(?:—|-|:)?\s*(?:step|phase|stage)\s*\d+\s*$/i;
  const STEP_SLUG = /-(?:step|phase|stage)-\d+$/i;

  const normalizeKey = (k) => {
    const t = (k.title || '').replace(STEP_SUFFIX,'').trim().toLowerCase();
    const s = (k.slug || '').replace(STEP_SLUG,'').trim().toLowerCase();
    return s || t;
  };

  function collapseSequences(arr) {
    const map = new Map();
    for (const it of arr) {
      const key = normalizeKey(it);
      if (!map.has(key)) {
        const copy = structuredClone(it);
        copy.title = String(copy.title || '').replace(STEP_SUFFIX,'').trim();
        copy.slug = (copy.slug ? String(copy.slug) : slugify(copy.title)).replace(STEP_SLUG,'');
        if (!copy.description || STEP_SUFFIX.test(String(it.title||''))) {
          copy.description = copy.description || 'A progressive, consensual practice—start comfortably and increase gradually together.';
        }
        map.set(key, copy);
      } else {
        const prev = map.get(key);
        const tags = new Set([...(prev.tags||[]), ...(it.tags||[])]);
        prev.tags = Array.from(tags);
        map.set(key, prev);
      }
    }
    return Array.from(map.values());
  }

  function dedupeByKey(arr) {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      const key = normalizeKey(it);
      if (!seen.has(key)) { seen.add(key); out.push(it); }
    }
    return out;
  }

  function resequenceIds(arr) {
    return arr.map((k, i) => ({ ...k, id: pad4(i) }));
  }

  function markDirty(d) {
    state.dirty = d;
    $('#btn-save').disabled = !state.dirty;
  }

  // API
  async function apiLoad() {
    const r = await fetch(`/api/kinks?lang=${state.lang}`);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Load failed');
    state.all = j.data;
    markDirty(false);
  }
  async function apiSave() {
    const r = await fetch(`/api/kinks?lang=${state.lang}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.all),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Save failed');
    markDirty(false);
  }

  // Filtering + paging
  function applyFilters() {
    const q = $('#search').value.trim().toLowerCase();
    const tier = $('#tier').value;
    const rows = state.all.filter(k => {
      if (tier && (k.tier !== tier)) return false;
      if (!q) return true;
      const hay = [k.title, k.slug, k.description, (k.tags||[]).join(','), k.category, (k.aliases||[]).join(',')]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
    state.filtered = rows;
    state.page = 1;
    render();
  }

  // Renderers
  function render() {
    $('#count').textContent = state.filtered.length;
    const ps = Number($('#pagesize').value) || 50;
    state.pagesize = ps;
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / ps));
    if (state.page > totalPages) state.page = totalPages;

    $('#pageinfo').textContent = `Page ${state.page}/${totalPages}`;
    $('#prev').disabled = state.page <= 1;
    $('#next').disabled = state.page >= totalPages;

    const start = (state.page - 1) * ps;
    const end = start + ps;
    const view = state.filtered.slice(start, end);

    const tbody = $('#rows');
    tbody.innerHTML = '';
    view.forEach((k, i) => {
      const tr = document.createElement('tr');
      tr.dataset.absIndex = start + i; // absolute index in filtered
      tr.innerHTML = `
        <td>${k.id}</td>
        <td>${k.slug}</td>
        <td>${k.title}</td>
        <td><span class="chip">${k.tier||'—'}</span></td>
        <td>${k.intensityScale ?? ''}</td>
        <td>${k.category ?? ''}</td>
        <td>${(k.tags||[]).join(', ')}</td>
      `;
      tr.addEventListener('click', () => {
        state.selectedIndex = start + i;
        fillEditor(state.filtered[state.selectedIndex]);
        highlightSelection();
      });
      tbody.appendChild(tr);
    });

    highlightSelection();
  }

  function highlightSelection() {
    $$('#rows tr').forEach((tr) => tr.classList.remove('sel'));
    if (state.selectedIndex >= 0) {
      const ps = state.pagesize;
      const pageStart = (state.page - 1) * ps;
      const rel = state.selectedIndex - pageStart;
      if (rel >= 0 && rel < ps) {
        const tr = $$('#rows tr')[rel];
        if (tr) tr.classList.add('sel');
      }
    }
  }

  // Editor
  function fillEditor(k) {
    $('#edit-title').textContent = k ? `Edit: ${k.title}` : 'Edit';
    $('#f-id').value = k?.id || '';
    $('#f-slug').value = k?.slug || '';
    $('#f-title').value = k?.title || '';
    $('#f-description').value = k?.description || '';
    $('#f-tier').value = k?.tier || '';
    $('#f-intensity').value = k?.intensityScale ?? '';
    $('#f-category').value = k?.category || '';
    $('#f-tags').value = (k?.tags || []).join(', ');
    $('#f-aliases').value = (k?.aliases || []).join(', ');
    $('#f-createdBy').value = k?.createdBy || 'system';

    // Preview
    $('#preview .card-title').textContent = k?.title || '—';
    $('#preview .card-desc').textContent = k?.description || '—';
    $('#pv-tier').textContent = `tier: ${k?.tier || '—'}`;
    $('#pv-int').textContent = `intensity: ${k?.intensityScale ?? '—'}`;
  }

  function readForm() {
    return {
      id: $('#f-id').value,
      slug: $('#f-slug').value,
      title: $('#f-title').value,
      description: $('#f-description').value,
      tier: $('#f-tier').value || undefined,
      intensityScale: Number($('#f-intensity').value || 0) || undefined,
      category: $('#f-category').value || '',
      tags: $('#f-tags').value ? $('#f-tags').value.split(',').map(s => s.trim()).filter(Boolean) : [],
      aliases: $('#f-aliases').value ? $('#f-aliases').value.split(',').map(s => s.trim()).filter(Boolean) : [],
      createdBy: $('#f-createdBy').value || 'system',
    };
  }

  function applyForm() {
    if (state.selectedIndex < 0) return;
    const k = readForm();

    // Ensure slug and title minimums
    if (!k.title) return alert('Title is required');
    if (!k.slug) k.slug = slugify(k.title);

    // Apply into the actual item in 'all' via its id
    const sel = state.filtered[state.selectedIndex];
    const idx = state.all.findIndex(x => x.id === sel.id);
    if (idx >= 0) {
      state.all[idx] = { ...state.all[idx], ...k };
      markDirty(true);
      applyFilters(); // re-filter + re-render
      // Keep selection on the same id
      state.selectedIndex = state.filtered.findIndex(x => x.id === k.id);
      highlightSelection();
      fillEditor(k);
    }
  }

  function addNew() {
    const nextId = pad4(state.all.length);
    const now = {
      id: nextId,
      slug: '',
      title: '',
      description: '',
      tags: [],
      category: '',
      intensityScale: 1,
      aliases: [],
      createdBy: 'user',
      tier: undefined,
    };
    state.all.push(now);
    markDirty(true);
    applyFilters();
    const ix = state.filtered.findIndex(x => x.id === nextId);
    state.selectedIndex = ix;
    fillEditor(now);
    highlightSelection();
  }

  function deleteSelected() {
    if (state.selectedIndex < 0) return;
    const sel = state.filtered[state.selectedIndex];
    if (!confirm(`Delete "${sel.title}" (${sel.id})?`)) return;
    const idx = state.all.findIndex(x => x.id === sel.id);
    if (idx >= 0) {
      state.all.splice(idx, 1);
      markDirty(true);
      state.selectedIndex = -1;
      applyFilters();
      fillEditor(null);
    }
  }

  // Wire events
  $('#btn-load').addEventListener('click', async () => {
    try {
      state.lang = $('#lang').value;
      await apiLoad();
      applyFilters();
      fillEditor(null);
      alert(`Loaded ${state.all.length} items for ${state.lang.toUpperCase()}`);
    } catch (e) {
      alert(`Load failed: ${e.message || e}`);
    }
  });
  $('#btn-save').addEventListener('click', async () => {
    try {
      await apiSave();
      alert('Saved successfully.');
    } catch (e) {
      alert(`Save failed: ${e.message || e}`);
    }
  });

  $('#search').addEventListener('input', applyFilters);
  $('#tier').addEventListener('change', applyFilters);
  $('#pagesize').addEventListener('change', render);
  $('#prev').addEventListener('click', () => { state.page = Math.max(1, state.page - 1); render(); });
  $('#next').addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pagesize));
    state.page = Math.min(totalPages, state.page + 1); render();
  });

  $('#btn-apply').addEventListener('click', applyForm);
  $('#btn-reset').addEventListener('click', () => fillEditor(state.filtered[state.selectedIndex] || null));
  $('#btn-add').addEventListener('click', addNew);
  $('#btn-delete').addEventListener('click', deleteSelected);

  // Tools
  $('#tool-collapse').addEventListener('click', () => {
    state.all = collapseSequences(state.all);
    markDirty(true);
    applyFilters();
  });
  $('#tool-dedupe').addEventListener('click', () => {
    state.all = dedupeByKey(state.all);
    markDirty(true);
    applyFilters();
  });
  $('#tool-slugify').addEventListener('click', () => {
    state.all = state.all.map(k => ({ ...k, slug: k.slug || slugify(k.title) }));
    markDirty(true);
    applyFilters();
  });
  $('#tool-reseq').addEventListener('click', () => {
    state.all = resequenceIds(state.all);
    markDirty(true);
    applyFilters();
  });
  $('#tool-sort').addEventListener('click', () => {
    state.all.sort((a,b) => String(a.title||'').localeCompare(String(b.title||'')));
    markDirty(true);
    applyFilters();
  });

  // Initial
  $('#btn-save').disabled = true;
  // Auto-load EN on open for convenience:
  (async () => { try { await apiLoad(); applyFilters(); } catch(e){} })();
})();
