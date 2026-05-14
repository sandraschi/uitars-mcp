# Tools Reference

4 MCP tools + 1 help tool. All available via the `/mcp` HTTP endpoint.

---

## `uitars_execute`

Execute a GUI task end-to-end. This is the main tool — screenshot → VLM → parse → execute loop.

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `task` | string | Yes | — | Natural language description of what to do |
| `max_steps` | int | No | 15 | Max action steps (1–50) before abort |

**Returns:**
```json
{
  "success": true,
  "task": "Open Notepad and type hello world",
  "steps": 4,
  "max_steps": 15,
  "message": "Typed 'hello world' in Notepad",
  "actions": [
    {"step": 1, "thought": "I see the desktop...", "action": "hotkey(key='win r')", "action_type": "hotkey", "status": "Pressed hotkey: win r"},
    {"step": 2, "thought": "Run dialog is open...", "action": "type(content='notepad')", "action_type": "type", "status": "Typed: 'notepad'"},
    {"step": 3, "thought": "Notepad is open...", "action": "type(content='hello world')", "action_type": "type", "status": "Typed: 'hello world'"},
    {"step": 4, "thought": "Task complete", "action": "finished(content='Typed hello world in Notepad')", "action_type": "finished", "status": "Task finished"}
  ]
}
```

---

## `uitars_screenshot`

Capture current desktop. Read-only.

**Parameters:** None.

**Returns:**
```json
{
  "success": true,
  "image_base64": "iVBORw0KGgo...",
  "width": 1920,
  "height": 1080
}
```

---

## `uitars_click`

Click at desktop coordinates.

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `x` | int | Yes | — | X coordinate |
| `y` | int | Yes | — | Y coordinate |
| `button` | string | No | `"left"` | `"left"` or `"right"` |

**Returns:**
```json
{"success": true, "x": 500, "y": 300, "button": "left"}
```

---

## `uitars_type`

Type text at current keyboard focus.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to type |

**Returns:**
```json
{"success": true, "text": "Hello, world!"}
```

---

## `uitars_help`

Get inline help — task reference, examples, and current configuration. No parameters.

**Returns:** Tool listing, example tasks, VLM configuration summary.
