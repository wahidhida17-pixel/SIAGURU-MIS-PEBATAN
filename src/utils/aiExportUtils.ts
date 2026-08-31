export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      return false;
    });
}

export function exportTextAsDoc(title: string, content: string): void {
  // Convert simple markdown headings & line breaks to Word-friendly HTML
  const formattedBody = content
    .replace(/^# (.*$)/gim, '<h1 style="color:#047857; font-size:18pt; margin-bottom:8pt;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; font-size:14pt; margin-top:14pt; margin-bottom:6pt;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color:#334155; font-size:12pt; margin-top:10pt; margin-bottom:4pt;">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 style="color:#475569; font-size:11pt; margin-top:8pt;">$1</h4>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br/>');

  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 20mm; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        th, td { border: 1px solid #333; padding: 6pt; font-size: 11pt; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        blockquote { border-left: 3px solid #059669; padding-left: 10pt; font-style: italic; color: #334155; margin: 10pt 0; }
        h1, h2, h3, h4 { font-family: Arial, Helvetica, sans-serif; }
      </style>
    </head>
    <body>
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8pt; margin-bottom: 16pt;">
        <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">MADRASAH IBTIDAIYAH SYURIYAH PEBATAN</h2>
        <p style="margin: 2pt 0; font-size: 10pt;">Sistem Administrasi Guru & Perangkat Ajar Digital (SIAGURU)</p>
      </div>
      <div>
        ${formattedBody}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDoc], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[/\\?%*:|"<>']/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printAIContent(title: string, markdownContent: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak dokumen.');
    return;
  }

  const formattedBody = markdownContent
    .replace(/^# (.*$)/gim, '<h1 style="color:#047857; font-size:18pt; margin-bottom:8pt;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; font-size:14pt; margin-top:14pt; margin-bottom:6pt;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color:#334155; font-size:12pt; margin-top:10pt; margin-bottom:4pt;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br/>');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 20mm; font-size: 12pt; line-height: 1.5; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 15pt; font-weight: bold; text-transform: uppercase; }
          .header p { margin: 2px 0; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #333; padding: 6px 10px; font-size: 11pt; text-align: left; }
          th { background-color: #f1f5f9; }
          blockquote { border-left: 3px solid #059669; padding-left: 12px; margin: 12px 0; font-style: italic; }
          @media print {
            body { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>MI SYURIYAH PEBATAN</h2>
          <p>DOKUMEN PERANGKAT AJAR & ADMINISTRASI GURU (SIAGURU AI)</p>
        </div>
        <div>
          ${formattedBody}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
