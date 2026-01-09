import { useState, useEffect } from 'react'
import { Wrench, Loader2 } from 'lucide-react'
import './SkillsPanel.css'

export default function SkillsPanel({ serverUrl, disabled, isActive, currentProject }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="skills-panel">
      <div className="panel-header">
        <h2>Skills</h2>
      </div>

      <div className="panel-content">
        {disabled ? (
          <div className="empty-state">
            <p>Connect to server to view skills</p>
          </div>
        ) : (
          <div className="empty-state">
            <Wrench size={48} className="empty-icon" />
            <p>Skills panel</p>
            <p className="empty-hint">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
