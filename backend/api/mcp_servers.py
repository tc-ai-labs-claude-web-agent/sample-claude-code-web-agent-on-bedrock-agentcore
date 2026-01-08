"""
MCP servers management endpoints.

Provides API endpoints for reading and managing MCP server configurations.
"""

import json
import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..models.schemas import ListMCPServersResponse, MCPServer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/mcp-servers", response_model=ListMCPServersResponse)
async def list_mcp_servers():
    """
    List all MCP servers from /workspace/.mcp.json configuration file.

    Reads the MCP server configuration from /workspace/.mcp.json and returns
    the list of configured servers with their settings.

    Returns:
        ListMCPServersResponse with server configurations

    Raises:
        HTTPException: If config file cannot be read
    """
    mcp_config_path = "/workspace/.mcp.json"
    logger.info(f"Reading MCP servers from {mcp_config_path}")

    # Check if file exists
    config_file = Path(mcp_config_path)
    if not config_file.exists():
        logger.warning(f"MCP config file not found at {mcp_config_path}")
        return ListMCPServersResponse(
            servers={},
            mcp_config_path=mcp_config_path,
            exists=False
        )

    try:
        # Read and parse JSON
        with open(config_file, 'r') as f:
            config_data = json.load(f)

        # Extract mcpServers section
        mcp_servers_raw = config_data.get('mcpServers', {})

        # Convert to MCPServer models
        servers = {}
        for name, config in mcp_servers_raw.items():
            try:
                servers[name] = MCPServer(
                    type=config.get('type', 'stdio'),
                    command=config.get('command', ''),
                    args=config.get('args', []),
                    env=config.get('env', {})
                )
            except Exception as e:
                logger.error(f"Failed to parse MCP server '{name}': {str(e)}")
                # Continue with other servers

        logger.info(f"Found {len(servers)} MCP servers")
        return ListMCPServersResponse(
            servers=servers,
            mcp_config_path=mcp_config_path,
            exists=True
        )

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in MCP config file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in MCP config file: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error reading MCP config: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read MCP config: {str(e)}"
        )
