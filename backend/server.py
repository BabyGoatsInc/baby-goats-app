from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import httpx
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Next.js API base URL (internal)
NEXTJS_API_BASE = "http://localhost:3001/api"

# HTTP client for proxying requests
http_client = httpx.AsyncClient()


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Baby Goats API Proxy Routes (existing endpoints)
@api_router.get("/profiles")
async def proxy_profiles(request: Request):
    """Proxy profiles requests to production profiles endpoint"""
    try:
        # Forward query parameters
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/profiles"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying profiles request: {e}")
        return JSONResponse(content={"error": "Failed to fetch profiles"}, status_code=500)

@api_router.post("/profiles")
async def proxy_profiles_post(request: Request):
    """Proxy profile creation to production profiles endpoint with service role key"""
    try:
        body = await request.json()
        # Route to production endpoint now that service role key is configured
        response = await http_client.post(f"{NEXTJS_API_BASE}/profiles", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying profile creation: {e}")
        return JSONResponse(content={"error": "Failed to create profile"}, status_code=500)

@api_router.get("/highlights")  
async def proxy_highlights(request: Request):
    """Proxy highlights requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/highlights"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying highlights request: {e}")
        return JSONResponse(content={"error": "Failed to fetch highlights"}, status_code=500)

@api_router.post("/highlights")
async def proxy_highlights_post(request: Request):
    """Proxy highlight creation to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/highlights", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying highlight creation: {e}")
        return JSONResponse(content={"error": "Failed to create highlight"}, status_code=500)

@api_router.get("/challenges")
async def proxy_challenges(request: Request):
    """Proxy challenges requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/challenges"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying challenges request: {e}")
        return JSONResponse(content={"error": "Failed to fetch challenges"}, status_code=500)

@api_router.post("/challenges")
async def proxy_challenges_post(request: Request):
    """Proxy challenge completion to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/challenges", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying challenge completion: {e}")
        return JSONResponse(content={"error": "Failed to complete challenge"}, status_code=500)

@api_router.get("/stats")
async def proxy_stats(request: Request):
    """Proxy stats requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/stats"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stats request: {e}")
        return JSONResponse(content={"error": "Failed to fetch stats"}, status_code=500)

@api_router.post("/stats")
async def proxy_stats_post(request: Request):
    """Proxy stat creation to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/stats", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stat creation: {e}")
        return JSONResponse(content={"error": "Failed to create stat"}, status_code=500)

@api_router.get("/likes")
async def proxy_likes(request: Request):
    """Proxy likes requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/likes"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying likes request: {e}")
        return JSONResponse(content={"error": "Failed to fetch likes"}, status_code=500)

@api_router.post("/likes")
async def proxy_likes_post(request: Request):
    """Proxy like toggle to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/likes", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying like toggle: {e}")
        return JSONResponse(content={"error": "Failed to toggle like"}, status_code=500)

@api_router.get("/storage")
async def proxy_storage_get(request: Request):
    """Proxy storage GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/storage"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying storage GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch storage"}, status_code=500)

@api_router.post("/storage")
async def proxy_storage_post(request: Request):
    """Proxy storage POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/storage", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying storage POST request: {e}")
        return JSONResponse(content={"error": "Failed to process storage request"}, status_code=500)

@api_router.get("/debug/schema")
async def proxy_debug_schema(request: Request):
    """Proxy debug schema requests to Next.js API"""
    try:
        response = await http_client.get(f"{NEXTJS_API_BASE}/debug/schema", timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying debug schema: {e}")
        return JSONResponse(content={"error": "Failed to fetch debug schema"}, status_code=500)

# Original FastAPI routes (keep for backwards compatibility)
@api_router.get("/")
async def root():
    return {"message": "Baby Goats API Proxy - Ready to serve!", "proxy_target": NEXTJS_API_BASE}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Test Next.js API connection on startup"""
    try:
        response = await http_client.get(f"{NEXTJS_API_BASE}/debug/schema", timeout=5.0)
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Next.js API proxy target")
        else:
            logger.warning(f"⚠️ Next.js API responded with status {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Next.js API: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await http_client.aclose()
