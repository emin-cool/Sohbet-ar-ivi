import pdfplumber, collections
import importlib.util

# Load ic-aktar script to reuse its functions
spec = importlib.util.spec_from_file_location("ic_aktar", "scripts/ic-aktar.py")
ic_aktar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ic_aktar)

with pdfplumber.open('pdfler/2026 06 08 kaynak bilinci ve beklentisizlik.pdf') as pdf:
    lines = ic_aktar.satirlari_cikar(pdf)
    body_font = collections.Counter(l['font'] for l in lines).most_common(1)[0][0]
    print(f'Body font: {body_font}')
    for i, l in enumerate(lines[:80]):
        print(f"{i:2d} | gap:{l['gap']} | font:{l['font']} | {l['text']}")
