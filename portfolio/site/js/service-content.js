// Previous content and exported backups can contain pipe-separated service entries.
export function serviceFields(entry) {
    if (typeof entry !== 'string') return entry;
    const [title = '', description = '', process = ''] = entry.split('|').map(value => value.trim());
    return { title, description, process };
}
