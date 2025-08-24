@echo off
setlocal
echo Starting MCP servers (git, fetch, screenshot, read-website)...

start "mcp-git" cmd /k npx -y @modelcontextprotocol/server-git
start "mcp-fetch" cmd /k npx -y @modelcontextprotocol/server-fetch
start "mcp-screenshot" cmd /k npx -y mcp-screenshot-website-fast
start "mcp-read" cmd /k npx -y mcp-read-website-fast

echo Launched. Each server is running in its own window. Close a window to stop that server.
endlocal

