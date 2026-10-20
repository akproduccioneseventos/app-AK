import json
from pathlib import Path
import pypdfium2 as pdfium

root = Path(__file__).resolve().parent
output = root / '150-pdf-margenes.json'
if output.exists():
    raise RuntimeError('Preserve prior receipt')
receipt = json.loads((root / '150-pdf-inspeccion.json').read_text())
pdf = pdfium.PdfDocument(Path('//?/' + Path(receipt['pdf']).as_posix()).read_bytes())
rows = []
for page_index in range(len(pdf)):
    page = pdf[page_index]
    text = page.get_textpage()
    count = text.count_chars()
    start = next((i for i in range(count) if text.get_text_range(i, 7) == 'http://'), None)
    if start is not None:
        boxes = []
        for i in range(start, count):
            char = text.get_text_range(i, 1)
            if char in ['\r', '\n', '\r\n']:
                break
            boxes.append(text.get_charbox(i))
        rows.append({'page': page_index + 1, 'pageWidth': page.get_width(),
                     'left': min(b[0] for b in boxes), 'right': max(b[2] for b in boxes),
                     'outsidePage': max(b[2] for b in boxes) > page.get_width(),
                     'rightMarginPoints': page.get_width() - max(b[2] for b in boxes)})
    text.close()
    page.close()
pdf.close()
output.write_text(json.dumps({'rows': rows, 'scope': 'Geometry of visible personalized link in actual mobile PDF'}, indent=2) + '\n')
print(json.dumps(rows))
