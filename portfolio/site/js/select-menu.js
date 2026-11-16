// Retain each native select as the form value and event source.
let serial = 0;
let closeCurrent;
const controls = new WeakMap();

export function focusSelect(select) {
    (controls.get(select) || select)?.focus();
}

export function styleSelects(root = document) {
    root.querySelectorAll('select:not([multiple])').forEach(select => {
        if (select.size > 1 || controls.has(select)) return;
        const id = 'galaxy-select-' + ++serial;
        const label = select.closest('label');
        const name = select.getAttribute('aria-label') || label?.textContent.trim().replace(select.textContent.trim(), '').trim() || 'Choose an option';
        const wrapper = document.createElement('div');
        wrapper.className = 'galaxy-select';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'galaxy-select-trigger';
        button.setAttribute('role', 'combobox');
        button.setAttribute('aria-label', name);
        button.setAttribute('aria-haspopup', 'listbox');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', id);
        const value = document.createElement('span');
        button.append(value);
        const list = document.createElement('div');
        list.className = 'galaxy-select-options';
        list.id = id;
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', name);
        list.hidden = true;
        wrapper.append(button, list);

        if (label) {
            const field = document.createElement('div');
            field.className = label.className + ' galaxy-select-field';
            const caption = document.createElement('span');
            caption.className = 'galaxy-select-label';
            caption.textContent = name;
            label.replaceWith(field);
            field.append(caption, select, wrapper);
        } else select.after(wrapper);
        select.hidden = true;
        controls.set(select, button);

        let active = -1, typed = '', typedAt = 0;
        const options = () => Array.from(select.options);
        const available = () => options().map((option, index) => ({ option, index })).filter(({option}) => !option.disabled && !option.hidden && !option.closest('optgroup')?.disabled);
        function mark(index) {
            active = index;
            for (const row of list.children) row.classList.toggle('is-active', row.dataset.index === String(index));
            const row = list.querySelector('[data-index="' + index + '"]');
            if (row) {
                button.setAttribute('aria-activedescendant', row.id);
                if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
                if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
                    list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
                }
            } else button.removeAttribute('aria-activedescendant');
        }
        function sync() {
            value.textContent = select.selectedOptions[0]?.label || 'Choose an option';
            button.disabled = select.disabled;
            if (button.disabled && !list.hidden) close();
            if (list.hidden) return;
            list.replaceChildren(...options().flatMap((option, index) => {
                if (option.hidden) return [];
                const row = document.createElement('div');
                row.className = 'galaxy-select-option';
                row.dataset.index = index;
                row.id = id + '-' + index;
                row.setAttribute('role', 'option');
                row.setAttribute('aria-selected', String(option.selected));
                if (option.disabled || option.closest('optgroup')?.disabled) row.setAttribute('aria-disabled', 'true');
                row.textContent = option.label;
                return [row];
            }));
            mark(active);
        }
        function close() {
            list.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.removeAttribute('aria-activedescendant');
            if (closeCurrent === close) closeCurrent = undefined;
        }
        function open(direction = 1) {
            closeCurrent?.();
            closeCurrent = close;
            const bounds = button.getBoundingClientRect();
            const below = document.documentElement.clientHeight - bounds.bottom;
            const above = bounds.top;
            const flip = below < 220 && above > below;
            wrapper.classList.toggle('opens-up', flip);
            list.style.maxHeight = Math.max(48, Math.min(256, (flip ? above : below) - 12)) + 'px';
            list.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            const entries = available();
            active = entries.some(entry => entry.index === select.selectedIndex) ? select.selectedIndex : (direction === 1 ? entries[0]?.index : entries.at(-1)?.index) ?? -1;
            sync();
        }
        function commit(index) {
            if (!available().some(entry => entry.index === index)) return;
            const previous = select.selectedIndex;
            select.selectedIndex = index;
            close();
            sync();
            if (index !== previous) {
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        button.addEventListener('click', () => list.hidden ? open() : close());
        button.addEventListener('blur', close);
        list.addEventListener('pointerdown', event => event.preventDefault());
        list.addEventListener('click', event => {
            const row = event.target.closest('[role="option"]');
            if (row) commit(Number(row.dataset.index));
        });
        button.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); return; }
            if (event.key === 'Tab') { close(); return; }
            if (['Enter', ' '].includes(event.key)) {
                event.preventDefault();
                if (list.hidden) open(); else commit(active);
                return;
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                if (list.hidden && !['Home','End'].includes(event.key)) { open(event.key === 'ArrowDown' ? 1 : -1); return; }
                if (list.hidden) open();
                const entries = available();
                const offset = entries.findIndex(entry => entry.index === active);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 :
                    Math.max(0, Math.min(entries.length - 1, offset + (event.key === 'ArrowDown' ? 1 : -1)));
                mark(entries[next]?.index ?? -1);
                return;
            }
            if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                if (list.hidden) open();
                const now = performance.now();
                typed = (now - typedAt < 650 ? typed : '') + event.key.toLowerCase();
                typedAt = now;
                const match = available().find(({option}) => option.label.trim().toLowerCase().startsWith(typed));
                if (match) mark(match.index);
            }
        });
        select.addEventListener('change', sync);
        select.form?.addEventListener('reset', () => queueMicrotask(sync));
        new MutationObserver(sync).observe(select, { subtree: true, childList: true, characterData: true, attributes: true });
        sync();
    });
}

document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.galaxy-select')) closeCurrent?.();
});
