# Lit-Based Proposal Builder

A browser-based guided proposal development tool for education students.

The app helps students move from literature review work into a research proposal through:

- Student Details
- A1 Core Construct Identification
- A2 Deepened Review and Pattern Mapping
- A3 From Patterns to Gaps
- A4 Literature-Based Problem and Questions
- Methodology
- Ethics
- Instrumentation
- Proposal Outline
- Readiness Check
- Print / Save as PDF

## Versions

- `index.html` is the stable version.
- `index-upload.html` is the upload version. It accepts accomplished A1-A3 forms as DOCX, PDF, or TXT files.

## How To Run

Open `index.html` or `index-upload.html` in a browser.

For best results, serve the folder locally:

```bash
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/index-upload.html
```

## Notes

This app uses localStorage to save drafts in the browser. It does not require a backend.

The upload version includes local browser libraries for DOCX and PDF text extraction.
