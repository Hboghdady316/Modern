import { styleSelects } from "./select-menu.js";
import { siteContent, whenReady } from './site-content.js';

whenReady(() => {
    const wrap = document.getElementById('social-links');
    for (const link of siteContent.profile.socials.filter(link => link.url)) {
        const a = document.createElement('a');
        a.className = 'social-link'; a.href = link.url; a.textContent = link.name;
        wrap?.append(a);
    }
    const form = document.getElementById('contact-form');
    if (!form) return;
    const extra = document.getElementById('inquiry-fields');
    const fields = {
        project: [['service','Service'], ['timeline','Target timeline'], ['budget','Budget range'], ['reference','Reference link']],
        job: [['company','Company'], ['role','Role'], ['arrangement','Working arrangement'], ['reference','Job description link']],
        other: [['company','Organization'], ['reference','Profile link']],
    };
    function refreshFields() {
        extra.replaceChildren(...fields[form.elements.type.value].map(([name, title]) => {
            const label = document.createElement('label'), input = document.createElement('input');
            label.textContent = title;
            input.name = name; input.maxLength = 300; input.className = 'input';
            label.append(input);
            return label;
        }));
    }
    form.elements.type.addEventListener('change', refreshFields);
    refreshFields();
    styleSelects(form);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const status = document.getElementById('inquiry-status'), button = form.querySelector('button[type=submit]');
        button.disabled = true;
        status.textContent = 'Sending…';
        try {
            const response = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
            if (!response.ok) throw Error((await response.json()).error);
            status.textContent = 'Message sent. Thank you for getting in touch.';
            form.reset(); refreshFields();
        } catch (e) {
            status.textContent = (e.message || 'Could not send your message.') + ' Your message is still here. You can also email ' + siteContent.profile.email + '.';
        } finally { button.disabled = false; }
    });
});
