# Safety

> **uitars-mcp controls your actual desktop.** Read this before running it.

## Fail-Safe

- **Corner abort:** Move mouse to screen corner (0,0) — `pyautogui.FAILSAFE` triggers `FailSafeException`, halting all automation.
- **Delay between actions:** 300ms pause after every mouse/keyboard action.
- **Step limit:** `UITARS_MAX_STEPS` (default 15) caps the number of actions per task. No infinite loops.
- **No persistent state:** Each `uitars_execute` call starts fresh. No memory of prior tasks.

## What It Can Do

- Click anywhere on screen
- Type arbitrary text into any window
- Press arbitrary key combinations (including system shortcuts)
- Open applications, dialogs, menus
- Scroll in any window

## What It Cannot Do

- Read your files (no filesystem access)
- Access the network beyond VLM API calls
- Run shell commands (unless you type them into a terminal window)
- Bypass UAC or Administrator prompts

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| VLM hallucinates wrong target | Fail-safe abort. Test with simple tasks first. |
| Agent clicks "Delete" instead of "Save" | Use `pywinauto-mcp` or `autohotkey-mcp` for precise Windows automation instead. |
| Sensitive data visible on screen | Screenshots stay in-memory. No disk persistence. Images go to your configured VLM endpoint — use local models for privacy. |
| Multi-monitor confusion | `mss` handles multi-monitor natively. Test on your setup before complex automation. |

## Sandboxing (Advanced)

For risky automation, pair uitars-mcp with fleet isolation tools:

- **virtualization-mcp** — run inside a Windows Sandbox or Hyper-V VM
- **robofang** — DeepFang pipeline for sanitized execution
- **pywinauto-mcp** — UI element-level control (no VLM, no screenshot guessing)

## Privacy

- **Local VLM (Ollama):** Screenshots never leave your machine.
- **Cloud VLM (Anthropic/OpenAI):** Screenshots are sent to the provider's API. Review their data policies.
- **No logging of screenshots:** Images are discarded after each step. Only action text is returned to the agent.

## Emergency Stop

Kill the server:
```powershell
Get-NetTCPConnection -LocalPort 10976 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Or close the uvicorn window / Ctrl+C in the terminal running the server.
