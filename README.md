# IEEEForge

"Transform Reports into Publication-Ready IEEE Papers"

## Setup Instructions

### Backend
1. `cd backend`
2. `python -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `export GEMINI_API_KEY=your_key`
5. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Docker
1. `docker-compose up --build`

## Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, PyMuPDF, python-docx, Ollama/Gemini
- **DB:** PostgreSQL with Prisma
