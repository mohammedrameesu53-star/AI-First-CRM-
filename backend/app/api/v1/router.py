from fastapi import APIRouter
from app.api.v1.endpoints import hcp

# Root API Router
api_router = APIRouter()

# Register endpoint modules with clean prefix namespaces
api_router.include_router(hcp.router, prefix="/hcp", tags=["Healthcare Professionals (HCPs)"])
