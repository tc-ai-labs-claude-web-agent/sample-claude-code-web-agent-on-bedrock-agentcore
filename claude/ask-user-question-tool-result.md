# AskUserQuestion Tool Result Submission

## Date
2026-01-08

## Summary
Fixed the answer submission format for the AskUserQuestion interactive tool to properly send tool results in the correct SDK format.

## Problem
Initially, answers from AskUserQuestion were being submitted as plain user message strings. After examining `.claude` project files, we discovered that answers should be submitted as structured `tool_result` messages with `tool_use_id`.

## Correct Format
According to the Claude Agent SDK, tool results should be submitted in this format:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_bdrk_01...",
      "content": "User has answered your questions: \"question\"=\"answer\""
    }
  ]
}
```

## Implementation Changes

### 1. Frontend - API Client (`web_client/src/api/client.js`)

Added `sendToolResult` method to both `DirectAPIClient` and `InvocationsAPIClient`:

```javascript
async sendToolResult(sessionId, toolResultMessage) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolResultMessage.tool_use_id,
            content: toolResultMessage.content
          }
        ]
      }
    })
  })
  handleFetchResponse(response)
  if (!response.ok) {
    throw new Error('Failed to send tool result')
  }
  return response.json()
}
```

### 2. Frontend - Message Component (`web_client/src/components/Message.jsx`)

Updated to pass `questions` parameter to the callback:

```javascript
// Line 51: Pass questions as third parameter
onSubmitAnswers={(answers) => onQuestionAnswer(toolUseId, answers, toolInput.questions)}
```

### 3. Frontend - Hook (`web_client/src/hooks/useClaudeAgent.js`)

The `submitQuestionAnswers` function (already updated) constructs the correct tool_result format:

```javascript
const submitQuestionAnswers = useCallback(async (toolUseId, answers, questions) => {
  if (!sessionId || !apiClientRef.current) return

  try {
    // Format the answer content for display
    const answerParts = Object.entries(answers).map(([question, answer]) => {
      return `"${question}"="${answer}"`
    })
    const contentText = `User has answered your questions: ${answerParts.join(', ')}. You can now continue with the user's answers in mind.`

    // Construct tool_result message in the format expected by SDK
    const toolResultMessage = {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: contentText,
      answers: answers,      // For debugging
      questions: questions   // For debugging
    }

    // Send via API client with tool_result handling
    await apiClientRef.current.sendToolResult(sessionId, toolResultMessage)
    console.log('Question answers submitted successfully')
  } catch (error) {
    addErrorMessage(`Failed to submit answers: ${error.message}`)
  }
}, [sessionId, addErrorMessage])
```

### 4. Backend - Schema (`backend/models/schemas.py`)

Updated `SendMessageRequest` to accept both string and dict:

```python
class SendMessageRequest(BaseModel):
    """Request to send a message in a session."""

    message: str | dict[str, Any]  # Can be string or structured message (e.g., with tool_result)
```

### 5. Backend - Session (`backend/core/session.py`)

Updated `send_message` and `send_message_stream` to accept both formats and convert dict to UserMessage object:

```python
async def send_message(self, message: str | dict) -> SendMessageResponse:
    """
    Send a message and get the response.

    Args:
        message: The user's message (string or structured UserMessage dict)

    Returns:
        SendMessageResponse with assistant's reply
    """
    if not self.client or self.status != "connected":
        raise HTTPException(status_code=400, detail="Session not connected")

    self.last_activity = datetime.now(timezone.utc)
    self.message_count += 1

    # Send message - SDK accepts Union[str, UserMessage]
    # If message is a dict with 'role' and 'content', construct UserMessage object
    if isinstance(message, dict):
        # Convert dict to UserMessage object
        message = UserMessage(**message)

    await self.client.query(message)
```

**Important**: The SDK requires a proper `UserMessage` object, not just a dict. We construct it using `UserMessage(**message)` when receiving a dict from the API.

## Message Flow

1. **User selects answers** in QuestionCard component
2. **QuestionCard calls callback** with (toolUseId, answers, questions)
3. **useClaudeAgent.submitQuestionAnswers** formats tool_result:
   - Constructs content text with answer key-value pairs
   - Creates tool_result message with tool_use_id
4. **API client sendToolResult** wraps in UserMessage format:
   - `role: "user"`
   - `content: [{ type: "tool_result", tool_use_id, content }]`
5. **Backend receives** structured message dict
6. **Session.send_message** passes to SDK via `client.query(message)`
7. **SDK processes** tool_result and continues conversation

## SDK Query Method Signature
According to the user's investigation:
```python
async def query(
    self,
    message: Union[str, UserMessage],
    model: Optional[str] = None,
) -> None
```

Where `UserMessage` format is:
```python
{
    "role": "user",
    "content": [...]  # List of content blocks (text or tool_result)
}
```

## Testing
To test this feature:
1. Start a session with Claude
2. Ask Claude a question that triggers AskUserQuestion tool
3. Fill out the question form with answers
4. Click "Submit Answers"
5. Verify that Claude receives the answers and continues the conversation

## Files Modified
1. `web_client/src/api/client.js` - Added sendToolResult to both API clients
2. `web_client/src/components/Message.jsx` - Pass questions to callback (line 51)
3. `web_client/src/hooks/useClaudeAgent.js` - Already had submitQuestionAnswers
4. `backend/models/schemas.py` - Updated SendMessageRequest to accept str | dict
5. `backend/core/session.py` - Updated send_message and send_message_stream to accept str | dict

## References
- Original AskUserQuestion feature: `claude/ask-user-question-feature.md`
- Claude Agent SDK query method accepts `Union[str, UserMessage]`
- Tool result format discovered from `.claude/projects/` session files
