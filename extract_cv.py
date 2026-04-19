import pdfplumber
import sys

with pdfplumber.open("data/Saud_Ahmad_CV_Netguru_v2 (1).pdf") as pdf:
    text = ""
    for page in pdf.pages:
        text += (page.extract_text() or "") + "\n"
print(text)
