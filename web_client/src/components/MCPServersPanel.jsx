import { useState, useEffect, useRef } from 'react'
import { Server, RefreshCw, ChevronRight, ChevronDown, Terminal } from 'lucide-react'
import { createAPIClient } from '../api/client'
import { getAgentCoreSessionId } from '../utils/authUtils'

function MCPServersPanel({ serverUrl, disabled, isActive, currentProject }) {
  const [mcpServers, setMcpServers] = useState({})
  const [mcpConfigPath, setMcpConfigPath] = useState('')
  const [configExists, setConfigExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedServers, setExpandedServers] = useState(new Set())
  const apiClientRef = useRef(null)
  const previousActiveRef = useRef(false)

  // Create API client
  useEffect(() => {
    if (disabled) {
      setMcpServers({})
      return
    }

    const initApiClient = async () => {
      if (serverUrl && (!apiClientRef.current || apiClientRef.current.baseUrl !== serverUrl)) {
        const agentCoreSessionId = await getAgentCoreSessionId(currentProject)
        apiClientRef.current = createAPIClient(serverUrl, agentCoreSessionId)
      }
    }
    initApiClient()
  }, [serverUrl, disabled, currentProject])

  // Auto-refresh when tab becomes active
  useEffect(() => {
    if (disabled) {
      previousActiveRef.current = isActive
      return
    }

    // Check if tab just became active (transition from false to true)
    if (isActive && !previousActiveRef.current) {
      const timer = setTimeout(() => {
        if (apiClientRef.current) {
          loadMCPServers()
        }
      }, 100)

      previousActiveRef.current = isActive
      return () => clearTimeout(timer)
    }

    previousActiveRef.current = isActive
  }, [isActive, disabled])

  const loadMCPServers = async () => {
    if (!apiClientRef.current) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiClientRef.current.listMCPServers()
      setMcpServers(data.servers || {})
      setMcpConfigPath(data.mcp_config_path || '')
      setConfigExists(data.exists || false)
    } catch (err) {
      console.error('Failed to load MCP servers:', err)
      setError(err.message)
      setMcpServers({})
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadMCPServers()
  }

  const toggleServerExpanded = (serverName) => {
    setExpandedServers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverName)) {
        newSet.delete(serverName)
      } else {
        newSet.add(serverName)
      }
      return newSet
    })
  }

  const serverCount = Object.keys(mcpServers).length

  return (
    <div className="mcp-servers-panel">
      <div className="mcp-servers-panel-header">
        <h2>
          <Server size={18} />
          MCP Servers
        </h2>
        <div className="mcp-servers-panel-actions">
          <button
            className="btn-icon btn-small"
            onClick={handleRefresh}
            disabled={loading || disabled}
            title="Refresh MCP servers"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="mcp-servers-info">
        <small>Config: {mcpConfigPath}</small>
        {configExists && <small style={{ color: 'var(--success-color)' }}>✓ Found {serverCount} server{serverCount !== 1 ? 's' : ''}</small>}
        {!configExists && !loading && <small style={{ color: 'var(--warning-color)' }}>⚠ Config file not found</small>}
      </div>

      <div className="mcp-servers-list-container">
        {loading && serverCount === 0 ? (
          <div className="mcp-servers-loading">
            <RefreshCw size={24} className="spinning" />
            <p>Loading MCP servers...</p>
          </div>
        ) : error ? (
          <div className="mcp-servers-error">
            <p style={{ color: 'var(--danger-color)' }}>Error: {error}</p>
          </div>
        ) : !configExists ? (
          <div className="mcp-servers-empty">
            <Server size={48} style={{ opacity: 0.3 }} />
            <p>No MCP configuration found</p>
            <small>Create {mcpConfigPath} to configure MCP servers</small>
          </div>
        ) : serverCount === 0 ? (
          <div className="mcp-servers-empty">
            <Server size={48} style={{ opacity: 0.3 }} />
            <p>No MCP servers configured</p>
            <small>Add servers to {mcpConfigPath}</small>
          </div>
        ) : (
          <div className="mcp-servers-list">
            {Object.entries(mcpServers).map(([name, config]) => {
              const isExpanded = expandedServers.has(name)
              return (
                <div key={name} className="mcp-server-item">
                  <button
                    className="mcp-server-header"
                    onClick={() => toggleServerExpanded(name)}
                  >
                    <div className="mcp-server-name">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Terminal size={14} />
                      <span>{name}</span>
                    </div>
                    <span className="mcp-server-type">{config.type}</span>
                  </button>

                  {isExpanded && (
                    <div className="mcp-server-details">
                      <div className="mcp-server-detail-row">
                        <span className="mcp-server-detail-label">Command:</span>
                        <code>{config.command}</code>
                      </div>

                      {config.args && config.args.length > 0 && (
                        <div className="mcp-server-detail-row">
                          <span className="mcp-server-detail-label">Arguments:</span>
                          <div className="mcp-server-args">
                            {config.args.map((arg, idx) => (
                              <code key={idx}>{arg}</code>
                            ))}
                          </div>
                        </div>
                      )}

                      {config.env && Object.keys(config.env).length > 0 && (
                        <div className="mcp-server-detail-row">
                          <span className="mcp-server-detail-label">Environment:</span>
                          <div className="mcp-server-env">
                            {Object.entries(config.env).map(([key, value]) => (
                              <div key={key} className="mcp-server-env-var">
                                <code>{key}={value}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MCPServersPanel
