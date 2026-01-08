# AskUserQuestion Interactive Feature

## Overview

Added support for Claude Agent SDK's `AskUserQuestion` tool, which allows Claude to ask users interactive questions with multiple choice options during conversations. Users can select from predefined options (single or multiple selection), and their answers are sent back to continue the conversation.

## Implementation

### Backend

The backend already supports `AskUserQuestion` through the Claude Agent SDK. When Claude calls this tool, it returns a `tool_use` event with:

```json
{
  "type": "tool_use",
  "tool_name": "AskUserQuestion",
  "tool_input": {
    "questions": [
      {
        "question": "Which tech stack do you want to use?",
        "header": "Tech Stack",
        "multiSelect": false,
        "options": [
          {
            "label": "Next.js + TypeScript (Recommended)",
            "description": "Modern React framework with SSR/SSG support"
          },
          ...
        ]
      }
    ]
  },
  "tool_use_id": "toolu_bdrk_01..."
}
```

### Frontend Changes

#### 1. New Component: `QuestionCard.jsx`

Created an interactive question card component that:
- Displays multiple questions in a single card
- Supports both single-select (radio) and multi-select (checkbox) options
- Shows question headers, prompts, and option descriptions
- Validates that all questions are answered before submission
- Displays submitted answers in a read-only format after submission

**Features**:
- **Single Select**: Radio buttons for exclusive choices
- **Multi Select**: Checkboxes for multiple selections
- **Visual Feedback**: Hover effects and selected state highlighting
- **Validation**: Submit button disabled until all questions answered
- **Confirmation**: Shows submitted answers in a summary view

#### 2. Modified `Message.jsx`

Updated to detect and render `AskUserQuestion` tool calls:
- Checks if `toolName === 'AskUserQuestion'`
- Renders `QuestionCard` component instead of generic tool display
- Passes `onQuestionAnswer` callback with `toolUseId` and answers

#### 3. Updated `useClaudeAgent.js`

Added `submitQuestionAnswers` function:
- Converts user selections to JSON format
- Sends as a user message to continue the conversation
- Format: `{"header1": "selection1", "header2": "selection2, selection3"}`
- Multi-select answers are joined with comma separator

#### 4. Updated `ChatContainer.jsx` and `App.jsx`

- Added `onQuestionAnswer` prop to pass down the callback
- Connected `submitQuestionAnswers` from hook to components

#### 5. Added CSS Styles

Enhanced `style.css` with comprehensive styling for:
- Question cards with header and content sections
- Option items with hover and selected states
- Submit button with disabled/enabled states
- Submitted answer display
- Responsive layout and spacing

## User Experience

### Flow

1. **Claude asks question**: User sees an interactive question card
2. **User selects options**: Click on options to select (radio or checkbox)
3. **Visual feedback**: Selected options are highlighted
4. **Submit answers**: Button enabled when all questions answered
5. **Confirmation**: Card shows submitted answers
6. **Continue conversation**: Claude receives answers and continues

### Example

```
┌─────────────────────────────────────────────┐
│ ❓ Please Answer the Following Questions    │
├─────────────────────────────────────────────┤
│                                             │
│ [Tech Stack]                                │
│ Which tech stack do you want to use?        │
│                                             │
│ ○ Next.js + TypeScript (Recommended)       │
│   Modern React framework with SSR/SSG       │
│                                             │
│ ○ Python Flask + Jinja2                    │
│   Lightweight Python framework              │
│                                             │
│ [Core Features] (Multiple selections)       │
│ Which features do you want?                 │
│                                             │
│ ☑ Article display and categorization       │
│   Basic blog functionality                  │
│                                             │
│ ☐ AI conversation integration              │
│   Integrate LLM APIs                        │
│                                             │
│                    [Submit Answers]          │
└─────────────────────────────────────────────┘
```

## Answer Format

Answers are submitted as a JSON object where:
- Keys: Question headers
- Values: Selected options (string for single, comma-separated for multi)

```json
{
  "Tech Stack": "Next.js + TypeScript (Recommended)",
  "Core Features": "Article display and categorization, AI conversation integration",
  "Deployment": "Vercel/Netlify (Recommended)"
}
```

## Technical Details

### Component Props

**QuestionCard**:
- `questions`: Array of question objects
- `onSubmitAnswers`: Callback function with answers object

**Message**:
- Added `onQuestionAnswer`: Callback with (toolUseId, answers)

### State Management

- Local state in `QuestionCard` for answer selections
- Submitted state to show confirmation view
- Validation logic to enable/disable submit button

### Styling Variables

Uses existing CSS variables for consistency:
- `--primary-color`: Main accent color
- `--success-color`: Confirmation indicators
- `--bg-primary/secondary/tertiary`: Backgrounds
- `--text-primary/secondary/tertiary`: Text colors
- `--border-color`: Borders and dividers

## Files Modified

1. `web_client/src/components/QuestionCard.jsx` - New component
2. `web_client/src/components/Message.jsx` - Added AskUserQuestion detection
3. `web_client/src/hooks/useClaudeAgent.js` - Added submitQuestionAnswers
4. `web_client/src/components/ChatContainer.jsx` - Prop passing
5. `web_client/src/App.jsx` - Prop passing
6. `web_client/src/style.css` - Added QuestionCard styles

## Implementation Date

2026-01-08

## Future Enhancements

Potential improvements:
- Add input validation for custom text answers
- Support for nested or conditional questions
- Keyboard navigation support
- Animation for option selection
- Save answer history for reference
- Export answers to file
