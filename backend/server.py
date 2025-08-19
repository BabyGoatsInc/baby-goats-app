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

# Advanced Social Features API Proxy Routes
@api_router.get("/messages")
async def proxy_messages_get(request: Request):
    """Proxy messages GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/messages"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying messages GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch messages"}, status_code=500)

@api_router.post("/messages")
async def proxy_messages_post(request: Request):
    """Proxy messages POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/messages", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying messages POST request: {e}")
        return JSONResponse(content={"error": "Failed to send message"}, status_code=500)

@api_router.put("/messages")
async def proxy_messages_put(request: Request):
    """Proxy messages PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/messages", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying messages PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update messages"}, status_code=500)

@api_router.get("/friendships")
async def proxy_friendships_get(request: Request):
    """Proxy friendships GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/friendships"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying friendships GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch friendships"}, status_code=500)

@api_router.post("/friendships")
async def proxy_friendships_post(request: Request):
    """Proxy friendships POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/friendships", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying friendships POST request: {e}")
        return JSONResponse(content={"error": "Failed to create friendship"}, status_code=500)

@api_router.put("/friendships")
async def proxy_friendships_put(request: Request):
    """Proxy friendships PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/friendships", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying friendships PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update friendship"}, status_code=500)

@api_router.delete("/friendships")
async def proxy_friendships_delete(request: Request):
    """Proxy friendships DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/friendships"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying friendships DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to delete friendship"}, status_code=500)

@api_router.get("/leaderboards")
async def proxy_leaderboards_get(request: Request):
    """Proxy leaderboards GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/leaderboards"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying leaderboards GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch leaderboards"}, status_code=500)

@api_router.post("/leaderboards")
async def proxy_leaderboards_post(request: Request):
    """Proxy leaderboards POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/leaderboards", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying leaderboards POST request: {e}")
        return JSONResponse(content={"error": "Failed to update leaderboards"}, status_code=500)

@api_router.put("/leaderboards")
async def proxy_leaderboards_put(request: Request):
    """Proxy leaderboards PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/leaderboards", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying leaderboards PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update leaderboard rankings"}, status_code=500)

@api_router.get("/notifications")
async def proxy_notifications_get(request: Request):
    """Proxy notifications GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/notifications"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying notifications GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch notifications"}, status_code=500)

@api_router.post("/notifications")
async def proxy_notifications_post(request: Request):
    """Proxy notifications POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/notifications", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying notifications POST request: {e}")
        return JSONResponse(content={"error": "Failed to create notification"}, status_code=500)

@api_router.put("/notifications")
async def proxy_notifications_put(request: Request):
    """Proxy notifications PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/notifications", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying notifications PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update notifications"}, status_code=500)

@api_router.delete("/notifications")
async def proxy_notifications_delete(request: Request):
    """Proxy notifications DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/notifications"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying notifications DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to delete notifications"}, status_code=500)

# Live Broadcasting System API Proxy Routes
@api_router.get("/streams")
async def proxy_streams_get(request: Request):
    """Proxy streams GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/streams"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying streams GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch streams"}, status_code=500)

@api_router.post("/streams")
async def proxy_streams_post(request: Request):
    """Proxy streams POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/streams", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying streams POST request: {e}")
        return JSONResponse(content={"error": "Failed to create stream"}, status_code=500)

@api_router.put("/streams")
async def proxy_streams_put(request: Request):
    """Proxy streams PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/streams", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying streams PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update stream"}, status_code=500)

@api_router.delete("/streams")
async def proxy_streams_delete(request: Request):
    """Proxy streams DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/streams"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying streams DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to delete stream"}, status_code=500)

@api_router.get("/viewers")
async def proxy_viewers_get(request: Request):
    """Proxy viewers GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/viewers"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying viewers GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch viewers"}, status_code=500)

@api_router.post("/viewers")
async def proxy_viewers_post(request: Request):
    """Proxy viewers POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/viewers", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying viewers POST request: {e}")
        return JSONResponse(content={"error": "Failed to join stream"}, status_code=500)

@api_router.put("/viewers")
async def proxy_viewers_put(request: Request):
    """Proxy viewers PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/viewers", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying viewers PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update viewer status"}, status_code=500)

@api_router.delete("/viewers")
async def proxy_viewers_delete(request: Request):
    """Proxy viewers DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/viewers"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying viewers DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to cleanup viewers"}, status_code=500)

@api_router.get("/stream-chat")
async def proxy_stream_chat_get(request: Request):
    """Proxy stream-chat GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/stream-chat"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stream-chat GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch chat messages"}, status_code=500)

@api_router.post("/stream-chat")
async def proxy_stream_chat_post(request: Request):
    """Proxy stream-chat POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/stream-chat", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stream-chat POST request: {e}")
        return JSONResponse(content={"error": "Failed to send chat message"}, status_code=500)

@api_router.put("/stream-chat")
async def proxy_stream_chat_put(request: Request):
    """Proxy stream-chat PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/stream-chat", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stream-chat PUT request: {e}")
        return JSONResponse(content={"error": "Failed to moderate chat message"}, status_code=500)

@api_router.delete("/stream-chat")
async def proxy_stream_chat_delete(request: Request):
    """Proxy stream-chat DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/stream-chat"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying stream-chat DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to clear chat"}, status_code=500)

# Team Management API Proxy Routes
@api_router.get("/teams")
async def proxy_teams_get(request: Request):
    """Proxy teams GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/teams"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying teams GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch teams"}, status_code=500)

@api_router.post("/teams")
async def proxy_teams_post(request: Request):
    """Proxy teams POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/teams", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying teams POST request: {e}")
        return JSONResponse(content={"error": "Failed to create team"}, status_code=500)

@api_router.put("/teams")
async def proxy_teams_put(request: Request):
    """Proxy teams PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/teams", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying teams PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update team"}, status_code=500)

@api_router.delete("/teams")
async def proxy_teams_delete(request: Request):
    """Proxy teams DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/teams"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying teams DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to delete team"}, status_code=500)

@api_router.get("/team-members")
async def proxy_team_members_get(request: Request):
    """Proxy team-members GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/team-members"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-members GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch team members"}, status_code=500)

@api_router.post("/team-members")
async def proxy_team_members_post(request: Request):
    """Proxy team-members POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/team-members", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-members POST request: {e}")
        return JSONResponse(content={"error": "Failed to join team"}, status_code=500)

@api_router.put("/team-members")
async def proxy_team_members_put(request: Request):
    """Proxy team-members PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/team-members", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-members PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update team member"}, status_code=500)

@api_router.delete("/team-members")
async def proxy_team_members_delete(request: Request):
    """Proxy team-members DELETE requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/team-members"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.delete(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-members DELETE request: {e}")
        return JSONResponse(content={"error": "Failed to remove team member"}, status_code=500)

@api_router.get("/team-challenges")
async def proxy_team_challenges_get(request: Request):
    """Proxy team-challenges GET requests to Next.js API"""
    try:
        query_params = str(request.url.query) if request.url.query else ""
        url = f"{NEXTJS_API_BASE}/team-challenges"
        if query_params:
            url += f"?{query_params}"
        
        response = await http_client.get(url, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-challenges GET request: {e}")
        return JSONResponse(content={"error": "Failed to fetch team challenges"}, status_code=500)

@api_router.post("/team-challenges")
async def proxy_team_challenges_post(request: Request):
    """Proxy team-challenges POST requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.post(f"{NEXTJS_API_BASE}/team-challenges", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-challenges POST request: {e}")
        return JSONResponse(content={"error": "Failed to create/register team challenge"}, status_code=500)

@api_router.put("/team-challenges")
async def proxy_team_challenges_put(request: Request):
    """Proxy team-challenges PUT requests to Next.js API"""
    try:
        body = await request.json()
        response = await http_client.put(f"{NEXTJS_API_BASE}/team-challenges", json=body, timeout=10.0)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except Exception as e:
        logging.error(f"Error proxying team-challenges PUT request: {e}")
        return JSONResponse(content={"error": "Failed to update team challenge progress"}, status_code=500)

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
