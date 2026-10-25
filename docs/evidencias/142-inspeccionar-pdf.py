import json
from pathlib import Path

import pypdfium2 as pdfium
from pypdf import PdfReader


root = Path(__file__).resolve().parent
reports = []
for project in ("chromium-desktop", "chromium-mobile"):
    source = root / f"142-kitchen-{project}.pdf"
    reader = PdfReader(source)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    normalized = " ".join(text.split())
    expected = ["Cocina y salon QA135", "Entrada QA135", "Principal QA135", "Infantil QA135", "Postre QA135", "Celiaco"]
    missing = [value for value in expected if value not in normalized]
    document = pdfium.PdfDocument(source)
    images = []
    for number in range(len(document)):
        output = root / f"142-kitchen-{project}-page-{number + 1}.png"
        page = document[number]
        bitmap = page.render(scale=1.5)
        bitmap.to_pil().save(output)
        bitmap.close()
        page.close()
        images.append(output.name)
    document.close()
    reports.append({"project": project, "pdf": source.name, "pages": len(reader.pages),
                    "text": text, "missing": missing, "renders": images})
    print(json.dumps({"project": project, "pages": len(reader.pages), "missing": missing}))
    assert not missing, f"Missing document text: {missing}"
(root / "142-pdf-inspeccion.json").write_text(json.dumps(reports, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
