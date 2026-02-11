// DOM VARIABLES
  const devNoteInput = document.getElementById('dev-note');
  const devNoteListbox = document.getElementById('dev-note-list');

  // STATE MANAGEMENT
  let devNotesSelectedOptionIndex = -1;

  // LOAD DATA INTO LISTBOXES
    function populateListbox(listbox, items, prefix) {
    listbox.innerHTML = ''; // Clear existing items
    items.forEach((item, index) => {
        const button = document.createElement('button');
        button.id = `${prefix}-${index}`;
        button.textContent = item.text;
        button.dataset.tags = item.tags?.join(',') || '';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabindex', '-1');
        listbox.appendChild(button);
    });
    }

  // HELPER FUNCTIONS
  const listboxFilterHandler = function(event) {
    const input = event.target;
    const listbox = document.getElementById(input.getAttribute('aria-controls'));
    const listboxItems = listbox.querySelectorAll('button');
    const typedValue = input.value.toLowerCase();

    listboxItems.forEach(item => {
      if (item.textContent.toLowerCase().includes(typedValue) || item.dataset.tags?.toLowerCase().includes(typedValue)) {
        item.classList.remove('hidden');
        if (listbox.classList.contains('hidden')) {
          listbox.classList.remove('hidden');
        }
      } else {
        item.classList.add('hidden');
      }
    });
  };

  const listboxItemClickHandler = function(event) {
    event.preventDefault();
    if (event.target && event.target.nodeName === "BUTTON") {
      const input = document.getElementById(event.target.closest('[role="listbox"]').getAttribute('aria-labelledby'));
      if (input) {
        input.value = event.target.textContent;
        event.target.closest('[role="listbox"]').classList.add('hidden');
      } else {
        console.log("ERROR: Could not find input associated with listbox");
      }
    }
  };

  const comboboxHideList = function(event) {
    const listbox = document.getElementById(event.target.getAttribute('aria-controls'));
    setTimeout(() => {
      listbox.classList.add('hidden');
    }, 100);
  };

  const comboboxShowList = function(event) {
    const listbox = document.getElementById(event.target.getAttribute('aria-controls'));
    listbox.classList.remove('hidden');
  };

  const listboxKeyDownHandler = function(event) {
    const listbox = document.getElementById(event.target.getAttribute('aria-controls'));
    const visibleOptions = Array.from(listbox.querySelectorAll('button:not(.hidden)'));
    
    if (visibleOptions.length === 0) return;
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        devNotesSelectedOptionIndex = Math.min(devNotesSelectedOptionIndex + 1, visibleOptions.length - 1);
        updateSelectedOption(visibleOptions, devNotesSelectedOptionIndex);
        this.setAttribute('aria-activedescendant', visibleOptions[devNotesSelectedOptionIndex]?.id || '');
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        devNotesSelectedOptionIndex = Math.max(devNotesSelectedOptionIndex - 1, 0);
        updateSelectedOption(visibleOptions, devNotesSelectedOptionIndex);
        this.setAttribute('aria-activedescendant', visibleOptions[devNotesSelectedOptionIndex]?.id || '');
        break;
        
      case 'Enter':
        event.preventDefault();
        if (devNotesSelectedOptionIndex >= 0 && visibleOptions[devNotesSelectedOptionIndex]) {
          this.value = visibleOptions[devNotesSelectedOptionIndex].textContent;
          listbox.classList.add('hidden');
          devNotesSelectedOptionIndex = -1;
          updateSelectedOption(visibleOptions, devNotesSelectedOptionIndex);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        listbox.classList.add('hidden');
        devNotesSelectedOptionIndex = -1;
        updateSelectedOption(visibleOptions, devNotesSelectedOptionIndex);
        break;
    }
  };

  function updateSelectedOption(options, selectedOptionIndex) {
    options.forEach((option, index) => {
      if (index === selectedOptionIndex) {
        option.setAttribute('aria-selected', 'true');
        option.classList.add('selected');
        option.scrollIntoView({ block: 'nearest' });
      } else {
        option.setAttribute('aria-selected', 'false');
        option.classList.remove('selected');
      }
    });
  }

  // Wait for messages from code.ts
    window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    if (msg.type === "loadData") {
        // Populate listboxes when data arrives from code.ts
        populateListbox(devNoteListbox, msg.devNotes, 'dev-note');
    } else if (msg.type === "clearTextField") {
        if (msg.field === "dev-note") {
        devNoteInput.value = '';
        } 
    }
    };

  // EVENT LISTENERS
  document.getElementById('create-suggestion').addEventListener('click', function (event) {
    event.preventDefault();
    let suggestionText;
    suggestionText = devNoteInput.value;

    parent.postMessage({ pluginMessage: { type: 'devNote', text: suggestionText } }, '*');
  });

  devNoteInput.addEventListener('input', listboxFilterHandler);
  devNoteListbox.addEventListener('click', listboxItemClickHandler);
  devNoteInput.addEventListener('focus', comboboxShowList);
  devNoteInput.addEventListener('blur', comboboxHideList);
  devNoteInput.addEventListener('keydown', listboxKeyDownHandler);
  devNoteInput.addEventListener('input', function() {
    devNotesSelectedOptionIndex = -1;
  });