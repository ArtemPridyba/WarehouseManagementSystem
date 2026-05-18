export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const escape = (val: unknown): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Якщо є кома, лапки або переноси — обгортаємо в лапки
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}