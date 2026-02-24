# 🧪 Pipeline Test Dataset

This folder contains sample inputs to test the Universal Converter pipeline.

## 📂 Raw Inputs
- images → for OCR testing
- pdf → text and scanned PDFs
- ppt → slide text extraction

## 📂 Expected Outputs
DOCX files generated after running the pipeline.

## ▶ How to Test

1. Copy `raw` contents into your local `edu_nexus_db/raw`
2. Run:

   python src/pipeline/run_pipeline.py

3. Compare generated DOCX with `expected_outputs`