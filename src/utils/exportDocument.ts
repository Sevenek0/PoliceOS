import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportElementAsFile(el: HTMLElement, kind: 'pdf' | 'png', filename: string): Promise<void> {
  // Render the A4 sheet itself (not its wrapper, which may be narrower than 210mm and clip it),
  // without the decorative drop shadow — html2canvas paints box-shadow over the page content.
  const target = el.querySelector<HTMLElement>('.a4-sheet') ?? el;
  const canvas = await html2canvas(target, {
    scale: 2,
    backgroundColor: '#ffffff',
    onclone: (_doc, cloned) => {
      cloned.style.boxShadow = 'none';
    },
  });

  if (kind === 'png') {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return;
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/png');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Long documents continue on further pages instead of being cut off.
  let offset = 0;
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
  while (imgHeight - offset - pageHeight > 1) {
    offset += pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -offset, pageWidth, imgHeight);
  }
  pdf.save(`${filename}.pdf`);
}
