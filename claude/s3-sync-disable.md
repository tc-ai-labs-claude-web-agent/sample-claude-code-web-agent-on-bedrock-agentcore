# Disabling S3 Sync

## Overview

The backend server supports disabling S3 synchronization via the `ENABLE_S3_SYNC` environment variable. This is useful for:
- Local development without S3
- Testing without AWS credentials
- Deployments that don't need workspace sync
- Reducing AWS costs

## Configuration

### Environment Variable

```bash
ENABLE_S3_SYNC=false
```

**Accepted values**:
- **Enable**: `true`, `1`, `yes` (case-insensitive)
- **Disable**: `false`, `0`, `no` (case-insensitive)
- **Default**: `true` (for backward compatibility)

### Example Usage

**Local development without S3**:
```bash
export ENABLE_S3_SYNC=false
uv run backend/server.py
```

**Docker with disabled S3 sync**:
```bash
docker run -e ENABLE_S3_SYNC=false -p 8080:8080 claude-agent-api-server
```

**Docker Compose**:
```yaml
services:
  api-server:
    environment:
      - ENABLE_S3_SYNC=false
      - ANTHROPIC_AUTH_TOKEN=${ANTHROPIC_AUTH_TOKEN}
```

## What Gets Disabled

When `ENABLE_S3_SYNC=false`, the following operations are skipped:

### 1. Claude Sync Manager Initialization
- No background backup task
- No automatic `.claude` directory sync from S3
- No periodic backups to S3

### 2. User .claude Directory Sync
In `invocations.py`, these operations are skipped:
- Initial sync from S3 on first request: `ensure_initial_sync(user_id)`
- Backup after each task completion

### 3. Project Directory Sync
In `invocations.py`, these operations are skipped:
- Project sync from S3: `sync_project_from_s3()`
- Project backup to S3: `backup_project_to_s3()`
- Automatic project directory creation/sync

### 4. Task Completion Backup
In `session.py`, after message stream completion:
- No backup call to `backup_after_task(user_id)`

## Server Startup Output

**With S3 sync enabled** (default):
```
📦 S3 Workspace Bucket: my-bucket
🔄 S3 Sync: Enabled
```

**With S3 sync disabled**:
```
⚠️  S3 sync disabled (ENABLE_S3_SYNC=false)
```

## Local Development

For local development without AWS credentials:

```bash
# .env file
ENABLE_S3_SYNC=false
ANTHROPIC_AUTH_TOKEN=your_key_here
WORKSPACE_BASE_PATH=/workspace
```

This allows the server to run without requiring:
- S3 bucket configuration
- AWS credentials
- s5cmd installation

## Backward Compatibility

- Default value is `true` to maintain backward compatibility
- Existing deployments continue to work without configuration changes
- Only explicit `ENABLE_S3_SYNC=false` disables sync

## Code Changes

The following files were modified to support this feature:

1. **backend/server.py**:
   - Check `ENABLE_S3_SYNC` before initializing Claude sync manager
   - Display sync status on startup

2. **backend/api/invocations.py**:
   - Check `ENABLE_S3_SYNC` before user .claude sync
   - Check `ENABLE_S3_SYNC` before project sync

3. **backend/core/session.py**:
   - Check `ENABLE_S3_SYNC` before backup after task completion

## Related Configuration

Other S3-related environment variables (still needed when sync is enabled):
- `S3_WORKSPACE_BUCKET`: S3 bucket name
- `S3_WORKSPACE_PREFIX`: S3 key prefix (default: "user_data")
- `WORKSPACE_BASE_PATH`: Local workspace path (default: "/workspace")

## Implementation Date

2026-01-08
