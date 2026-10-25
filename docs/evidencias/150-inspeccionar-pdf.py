import base64
import hashlib
import io
import json
import re
from pathlib import Path

import pypdfium2 as pdfium
from pypdf import PdfReader

root = Path(__file__).resolve().parent
target = root / '150-pdf-inspeccion.json'
if target.exists():
    raise RuntimeError('Preserve previous inspection receipt')
report = json.loads((root / '150-comercial-aceptacion-results.json').read_text(encoding='utf-8'))
attachments = []


def walk(suite):
    for child in suite.get('suites', []):
        walk(child)
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            for result in test.get('results', []):
                attachments.extend(result.get('attachments', []))


walk(report)
source = Path(next(a['path'] for a in attachments if a['name'] == 'presupuesto-movil'))
data = json.loads(base64.b64decode(next(a['body'] for a in attachments if a['name'] == 'documentos-ficticios-antes-y-despues')))
pdf_bytes = Path('//?/' + source.as_posix()).read_bytes()
reader = PdfReader(io.BytesIO(pdf_bytes))
document = pdfium.PdfDocument(pdf_bytes)
pages = []
all_text = ''
for index, page in enumerate(reader.pages):
    text = page.extract_text() or ''
    all_text += '\n' + text
    output = root / f'150-presupuesto-movil-pagina-{index + 1}.png'
    rendered_page = document[index]
    bitmap = rendered_page.render(scale=1.3)
    bitmap.to_pil().save(output)
    bitmap.close()
    rendered_page.close()
    pages.append({'number': index + 1, 'width': float(page.mediabox.width),
                  'height': float(page.mediabox.height), 'textCharacters': len(text), 'render': output.name})
document.close()
for attachment in attachments:
    if attachment['name'] in ['resumen-movil', 'crm-movil-recargado'] and attachment.get('body'):
        (root / f"150-{attachment['name']}.png").write_bytes(base64.b64decode(attachment['body']))
normalized = ' '.join(all_text.split())
items = data['presupuesto']['itemsPresupuestados']
missing = [item['nombreServicio'] for item in items if ' '.join(item['nombreServicio'].split()) not in normalized]
result = {'sourceSha': '7230f9d02b32805952a185f704a0208bd5d643e6', 'pdf': str(source),
          'pdfSha256': hashlib.sha256(pdf_bytes).hexdigest(), 'pages': pages,
          'expectedTotal': data['presupuesto']['totalConDescuento'], 'itemCount': len(items),
          'missingNamesExactText': missing, 'text': all_text,
          'scope': 'Actual mobile download, text extraction and renders; visual acceptance separate',
          'a4AllPages': all(abs(p['width'] - 595.28) < 2 and abs(p['height'] - 841.89) < 2 for p in pages)}
target.write_text(json.dumps(result, indent=2, ensure_ascii=True) + '\n', encoding='utf-8')
print(json.dumps({key: result[key] for key in ['itemCount', 'missingNamesExactText', 'expectedTotal', 'a4AllPages']}))
print(json.dumps({'pages': len(pages), 'renders': [p['render'] for p in pages]}))
