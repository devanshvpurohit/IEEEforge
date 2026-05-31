from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.api.export import router as export_router

app = FastAPI(title="IEEEForge API", version="1.0.0")

# Include routers
app.include_router(documents_router, prefix="/api")
app.include_router(export_router, prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "online", "message": "IEEEForge Backend is running"}

@app.get("/api/v1/health")
async def api_health():
    return {"status": "ok", "service": "api"}
