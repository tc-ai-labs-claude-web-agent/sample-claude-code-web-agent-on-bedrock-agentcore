# Session Auto-Resume and Auto-Create Feature

## Overview

The session manager now supports:
1. **Auto-Resume**: Automatically resume sessions from disk when not found in memory
2. **Auto-Create**: Automatically create new sessions if session ID doesn't exist

This provides a seamless experience where clients can send messages with any session ID, and the server will either resume an existing session or create a new one.

## Problem

Previously, when a client sent a message to a session that was not active in memory:

```json
{
  "path": "/sessions/{session_id}/messages/stream",
  "method": "POST",
  "payload": {"message": "hi"},
  "path_params": {"session_id": "91d939ec-d97b-421f-8e2c-5cdcb42c43a3"}
}
```

The server would return a 404 error because `get_session()` only looked for sessions in memory (`self.sessions` dict).

## Solution

Modified `SessionManager.get_session()` to support automatic session resumption and creation:

### Changes Made

1. **session_manager.py**:
   - Changed `get_session()` from sync to async method
   - Added `auto_resume` parameter (default: `True`)
   - Added `user_id` parameter for session creation
   - When session not in memory, searches for session file on disk
   - Automatically resumes session by calling `create_session()` with `resume_session_id`

2. **Updated all callers**:
   - `backend/api/messages.py`: All endpoints now use `await manager.get_session()`
   - `backend/api/permissions.py`: Permission endpoint updated
   - `backend/api/sessions.py`: Server info endpoint updated
   - `backend/api/invocations.py`: Status and message stream endpoints pass `user_id`

### How It Works

```python
async def get_session(
    self,
    session_id: str,
    auto_resume: bool = True,
    user_id: Optional[str] = None,
    cwd: Optional[str] = None,
) -> AgentSession:
    # Check memory first
    if session_id in self.sessions:
        return self.sessions[session_id]

    # If not in memory and auto_resume enabled
    if auto_resume:
        # Try to find session file on disk
        if session_file_exists:
            # Resume existing session
            # Extract cwd from session file
            # Resume session with create_session()
        else:
            # Create new session with provided session_id
            # Use provided cwd or None
            # Create session with create_session()

        # Return session
```

### Auto-Resume/Create Process

1. Check if session exists in memory → return if found
2. Search `~/.claude/projects/*/session_id.jsonl` for session file
3. **If session file found** (existing session):
   - Parse session file to extract `cwd` and metadata
   - Call `create_session()` with `resume_session_id` parameter
   - Return the resumed session
4. **If session file NOT found** (new session):
   - Call `create_session()` with provided `session_id` as `resume_session_id`
   - Use provided `cwd` (from project_name) or None
   - Return the newly created session

### Session Configuration on Resume

When auto-resuming, the following configuration is used:

- `cwd`: Extracted from session file
- `model`: From `ANTHROPIC_MODEL` environment variable
- `background_model`: `None`
- `enable_proxy`: `False`
- `server_port`: `8080`

These defaults ensure sessions can be resumed even without the original configuration.

## Benefits

1. **Seamless Experience**: Clients don't need to manually detect and resume sessions
2. **Server Restart Resilience**: Sessions survive server restarts
3. **Session Expiration Handling**: Expired sessions are automatically restored on next use
4. **No Pre-Creation Required**: Clients can send messages with any session ID without calling createSession first
5. **Backward Compatible**: Existing code works without changes
6. **Session ID in Response**: The `start` event includes the session_id for client tracking

## Usage

### For Clients (Web/CLI)

**Option 1: Traditional Flow (still supported)**
```javascript
// 1. Create session explicitly
const { session_id } = await createSession({ model: "..." })

// 2. Send message
await sendMessage(session_id, "Hello")
```

**Option 2: Simplified Flow (new)**
```javascript
// 1. Generate or use any session ID (e.g., from agentcore_session_id)
const session_id = "user123@workspace/my-project"

// 2. Send message directly - session will be created automatically
await sendMessage(session_id, "Hello")

// 3. Listen for "start" event to get real session_id
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === "start") {
    // Update local session_id if different
    if (data.session_id !== session_id) {
      session_id = data.session_id
    }
  }
}
```

No changes needed! Sessions are automatically resumed or created as needed.

### For Developers

If you need to disable auto-resume (rare cases):

```python
session = await manager.get_session(session_id, auto_resume=False)
```

To provide user_id for better session tracking:

```python
session = await manager.get_session(session_id, user_id=user_id)
```

## Error Handling

If auto-resume fails, the following error is returned:

```
HTTPException(404, "Session {session_id} not found (not in memory and no session file on disk)")
```

This indicates:
- Session is not active in memory
- No session file exists on disk
- Session ID is invalid or was never created

## Implementation Date

2026-01-08

## Related Files

- `backend/core/session_manager.py`: Core implementation
- `backend/api/messages.py`: Message endpoints
- `backend/api/permissions.py`: Permission endpoints
- `backend/api/sessions.py`: Session management endpoints
- `backend/api/invocations.py`: Unified invocation endpoint
