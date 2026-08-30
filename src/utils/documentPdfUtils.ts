import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>']/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .trim();
}

export async function exportElementToPDF(
  elementId: string, 
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return;
  }

  try {
    // Render high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const cleanName = sanitizeFileName(fileName);
    pdf.save(cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to window print if canvas fails
    window.print();
  }
}
