// ============================================================
// A11y Annotations Plugin — UI Logic
// ============================================================

// ---------- DOM references ----------
const devNoteInput   = document.getElementById('dev-note');
const devNoteListbox = document.getElementById('dev-note-list');
const appNoteInput   = document.getElementById('app-note');
const appNoteListbox = document.getElementById('app-note-list');

// ---------- Per-combobox selected-index state ----------
const state = {
  'dev-note': -1,
  'app-note': -1,
};

// ---------- Populate a listbox with items ----------
function populateListbox(listbox, items, prefix) {
  listbox.innerHTML = '';
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.id = `${prefix}-${index}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('tabindex', '-1');
    button.dataset.tags = item.tags?.join(',') || '';

    // Recommendation text
    const textSpan = document.createElement('span');
    textSpan.className = 'suggestion-text';
    textSpan.textContent = item.text;
    button.appendChild(textSpan);

    // Tag chips
    if (item.tags && item.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'suggestion-tags';
      item.tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'suggestion-tag';
        chip.textContent = tag;
        tagsDiv.appendChild(chip);
      });
      button.appendChild(tagsDiv);
    }

    listbox.appendChild(button);
  });
}

// ---------- Filter handler ----------
function listboxFilterHandler(event) {
  const input = event.target;
  const listbox = document.getElementById(input.getAttribute('aria-controls'));
  const typedValue = input.value.toLowerCase();

  listbox.querySelectorAll('button').forEach(btn => {
    const textMatch = btn.querySelector('.suggestion-text').textContent.toLowerCase().includes(typedValue);
    const tagMatch  = btn.dataset.tags?.toLowerCase().includes(typedValue);
    btn.classList.toggle('hidden', !(textMatch || tagMatch));
  });

  listbox.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');

  // Announce the number of matching results
  const visibleCount = listbox.querySelectorAll('button:not(.hidden)').length;
  const notificationId = input.id + '-notifications';
  const notification = document.getElementById(notificationId);
  if (notification) {
    const plural = visibleCount === 1 ? '' : 's';
    notification.textContent = visibleCount === 0
      ? 'No results found'
      : `${visibleCount} result${plural} available`;
  }
}

// ---------- Listbox click ----------
function listboxItemClickHandler(event) {
  event.preventDefault();
  const btn = event.target.closest('button[role="option"]');
  if (!btn) return;

  const listbox = btn.closest('[role="listbox"]');
  const input   = document.getElementById(listbox.getAttribute('aria-labelledby')?.replace('-label', ''));
  if (input) {
    input.value = btn.querySelector('.suggestion-text').textContent;
    listbox.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    state[input.id] = -1;
  }
}

// ---------- Hide / show listbox on blur/focus ----------
function comboboxHideList(event) {
  const input = event.target;
  const listbox = document.getElementById(input.getAttribute('aria-controls'));
  setTimeout(() => {
    listbox.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
  }, 150);
}

function comboboxShowList(event) {
  const input = event.target;
  const listbox = document.getElementById(input.getAttribute('aria-controls'));
  // Show all visible items (un-hide previously filtered ones)
  listbox.querySelectorAll('button.hidden').forEach(btn => {
    // only un-hide if we're showing everything (input is empty)
    if (input.value.trim() === '') btn.classList.remove('hidden');
  });
  listbox.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');
}

// ---------- Keyboard navigation ----------
function listboxKeyDownHandler(event) {
  const input   = event.target;
  const listbox = document.getElementById(input.getAttribute('aria-controls'));
  const isOpen  = !listbox.classList.contains('hidden');
  const visible = Array.from(listbox.querySelectorAll('button:not(.hidden)'));

  // ArrowDown on a closed listbox should open it
  if (!isOpen && event.key === 'ArrowDown') {
    event.preventDefault();
    comboboxShowList(event);
    return;
  }

  if (visible.length === 0) return;

  let idx = state[input.id];

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      idx = Math.min(idx + 1, visible.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      idx = Math.max(idx - 1, 0);
      break;
    case 'Enter':
      event.preventDefault();
      if (idx >= 0 && visible[idx]) {
        input.value = visible[idx].querySelector('.suggestion-text').textContent;
        listbox.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        idx = -1;
        updateSelectedOption(visible, idx);
      }
      state[input.id] = idx;
      return;
    case 'Escape':
      event.preventDefault();
      listbox.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      idx = -1;
      updateSelectedOption(visible, idx);
      state[input.id] = idx;
      return;
    default:
      return;
  }

  state[input.id] = idx;
  updateSelectedOption(visible, idx);
  input.setAttribute('aria-activedescendant', visible[idx]?.id || '');
}

function updateSelectedOption(options, selectedIndex) {
  options.forEach((opt, i) => {
    const selected = i === selectedIndex;
    opt.setAttribute('aria-selected', String(selected));
    opt.classList.toggle('selected', selected);
    if (selected) opt.scrollIntoView({ block: 'nearest' });
  });
}

// ---------- Tab switching ----------
const tabs   = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');
    tab.focus();

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.classList.add('active');
    panel.hidden = false;
  });

  // Arrow-key tab navigation (ARIA pattern)
  tab.addEventListener('keydown', e => {
    const tabList = Array.from(tabs);
    const idx     = tabList.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabList[(idx + 1) % tabList.length].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabList[(idx - 1 + tabList.length) % tabList.length].focus();
    }
  });
});

// ---------- Messages from code.ts ----------
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'loadData') {
    populateListbox(devNoteListbox, msg.devNotes,    'dev-note');
    populateListbox(appNoteListbox, msg.appDevNotes, 'app-note');
  } else if (msg.type === 'clearTextField') {
    if (msg.field === 'dev-note') devNoteInput.value = '';
    if (msg.field === 'app-note') appNoteInput.value = '';
  }
};

// ---------- Submit handlers ----------
document.getElementById('create-web-note').addEventListener('click', () => {
  const text = devNoteInput.value.trim();
  if (!text) return;
  parent.postMessage({ pluginMessage: { type: 'devNote', text, source: 'web' } }, '*');
});

document.getElementById('create-app-note').addEventListener('click', () => {
  const text = appNoteInput.value.trim();
  if (!text) return;
  parent.postMessage({ pluginMessage: { type: 'devNote', text, source: 'app' } }, '*');
});

document.getElementById('approve-design').addEventListener('click', () => {
  parent.postMessage({ pluginMessage: { type: 'approveDesign' } }, '*');
});

// ---------- Wire up event listeners for both comboboxes ----------
[
  { input: devNoteInput, listbox: devNoteListbox },
  { input: appNoteInput, listbox: appNoteListbox },
].forEach(({ input, listbox }) => {
  input.addEventListener('input',  listboxFilterHandler);
  input.addEventListener('focus',  comboboxShowList);
  input.addEventListener('blur',   comboboxHideList);
  input.addEventListener('keydown', listboxKeyDownHandler);
  input.addEventListener('input',  () => { state[input.id] = -1; });
  listbox.addEventListener('click', listboxItemClickHandler);
});