"""
FastAPI API Gateway - Main Application
Serves as a lightweight gateway routing requests to different agents
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import logging

# Import agent handlers
from app.agents.agent1 import handle_agent1_request
from app.agents.agent2 import handle_agent2_request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Agent Gateway",
    description="Lightweight API gateway for AI agents and services",
    version="1.0.0"
)

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class AgentRequest(BaseModel):
    """Generic request model for agent endpoints"""
    prompt: str
    context: Dict[str, Any] = {}
    parameters: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    """Generic response model for agent endpoints"""
    success: bool
    data: Dict[str, Any]
    error: str = None

# Health check endpoint
@app.get("/")
async def health_check():
    """Root endpoint for health checks"""
    return {
        "status": "healthy",
        "service": "AI Agent Gateway",
        "version": "1.0.0"
    }

# Agent 1 endpoint
@app.post("/agent1", response_model=AgentResponse)
async def agent1_endpoint(request: AgentRequest):
    """Route requests to Agent 1"""
    try:
        logger.info(f"Agent 1 request: {request.prompt}")
        result = await handle_agent1_request(
            prompt=request.prompt,
            context=request.context,
            parameters=request.parameters
        )
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Agent 1 error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent 2 endpoint
@app.post("/agent2", response_model=AgentResponse)
async def agent2_endpoint(request: AgentRequest):
    """Route requests to Agent 2"""
    try:
        logger.info(f"Agent 2 request: {request.prompt}")
        result = await handle_agent2_request(
            prompt=request.prompt,
            context=request.context,
            parameters=request.parameters
        )
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Agent 2 error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# List available agents
@app.get("/agents")
async def list_agents():
    """List all available agent endpoints"""
    return {
        "agents": [
            {
                "name": "agent1",
                "endpoint": "/agent1",
                "description": "Mock agent for text processing"
            },
            {
                "name": "agent2",
                "endpoint": "/agent2",
                "description": "Mock agent for data analysis"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)
