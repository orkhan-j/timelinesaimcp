#!/usr/bin/env python3
import logging
import os
from datetime import datetime
from typing import Optional, Dict, Any
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables for ProfitWell
API_BASE = os.getenv('PROFITWELL_API_BASE', 'https://api.profitwell.com')
TOKEN = os.getenv('PROFITWELL_API_TOKEN')
N8N_WEBHOOK_URL = os.getenv('N8N_METRICS_WEBHOOK_URL')

mcp = FastMCP("multi-tool-server")

@mcp.tool()
def add(a: int, b: int) -> int:
    return a + b

@mcp.tool()
def subtract(a: int, b: int) -> int:
    return a - b

@mcp.tool()
def multiply(a: int, b: int) -> int:
    return a * b

@mcp.tool()
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

# ProfitWell API Tools
@mcp.tool()
def profitwell_get_customer(customer_id: str) -> Dict[str, Any]:
    """
    Retrieve a single customer by provider customer_id from ProfitWell API.
    
    Args:
        customer_id: The unique identifier for the customer
        
    Returns:
        Customer data from ProfitWell API
    """
    if not TOKEN:
        raise ValueError("PROFITWELL_API_TOKEN environment variable is required")
        
    url = f"{API_BASE}/v2/customers/{customer_id}/"
    headers = {"Authorization": TOKEN}
    
    try:
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error getting customer {customer_id}: {e}")
        raise ValueError(f"Failed to get customer: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error getting customer {customer_id}: {e}")
        raise ValueError(f"Failed to get customer: {str(e)}")

@mcp.tool()
def profitwell_search_customers(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
    direction: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search and paginate through customers by updated_on date field.
    
    Args:
        start_date: Start date filter (ISO format, e.g., "2025-08-01T00:00:00Z")
        end_date: End date filter (ISO format)
        page: Page number for pagination
        per_page: Number of results per page
        direction: Sort direction ("asc" or "desc")
        
    Returns:
        Paginated customer data from ProfitWell API
    """
    if not TOKEN:
        raise ValueError("PROFITWELL_API_TOKEN environment variable is required")
        
    url = f"{API_BASE}/v2/customers/"
    headers = {"Authorization": TOKEN}
    
    params = {"date_field": "updated_on"}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    if page is not None:
        params["page"] = page
    if per_page is not None:
        params["per_page"] = per_page
    if direction:
        if direction not in ["asc", "desc"]:
            raise ValueError("direction must be 'asc' or 'desc'")
        params["direction"] = direction
    
    try:
        with httpx.Client() as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error searching customers: {e}")
        raise ValueError(f"Failed to search customers: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error searching customers: {e}")
        raise ValueError(f"Failed to search customers: {str(e)}")

@mcp.tool()
def profitwell_metrics_daily_via_n8n(
    period: str,
    plan_id: Optional[str] = None,
    metric: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get daily metrics (This Month/Last Month) via n8n webhook.
    
    Args:
        period: Time period ("this_month" or "last_month")
        plan_id: Optional plan ID filter
        metric: Optional specific metric to retrieve
        
    Returns:
        Daily metrics data from n8n workflow
    """
    if not N8N_WEBHOOK_URL:
        raise ValueError("N8N_METRICS_WEBHOOK_URL environment variable is required")
    
    if period not in ["this_month", "last_month"]:
        raise ValueError("period must be 'this_month' or 'last_month'")
    
    payload = {"period": period}
    if plan_id:
        payload["plan_id"] = plan_id
    if metric:
        payload["metric"] = metric
    
    try:
        with httpx.Client() as client:
            response = client.post(N8N_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error calling n8n webhook: {e}")
        raise ValueError(f"Failed to get metrics via n8n: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error calling n8n webhook: {e}")
        raise ValueError(f"Failed to get metrics via n8n: {str(e)}")

@mcp.resource("health://status")
def health_status() -> str:
    return str({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "server_name": "multi-tool-server",
        "tools_available": [
            "add", "subtract", "multiply", "divide",
            "profitwell_get_customer", "profitwell_search_customers", "profitwell_metrics_daily_via_n8n"
        ],
        "profitwell_config": {
            "api_base": API_BASE,
            "has_token": bool(TOKEN),
            "has_n8n_webhook": bool(N8N_WEBHOOK_URL),
        }
    })

@mcp.custom_route("/health", methods=["GET"])
async def health_check(request: Request) -> JSONResponse:
    return JSONResponse({"status": "alive"}, status_code=200)

if __name__ == "__main__":
    logger.info("Starting FastMCP server in SSE mode on http://0.0.0.0:8080")
    mcp.run(transport="sse", host="0.0.0.0", port=8080)
