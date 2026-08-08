# Sample teams

Ready-to-import org charts for testing. On the home screen click **Start a New
Project**, give it a name, and paste one of these files into the JSON box.

| File | Shape | Exercises |
|---|---|---|
| `team-ecommerce-minimal.json` | 3 agents, 2 levels | Fastest draft → delegate → submit → approve loop. |
| `team-fintech-payments.json` | 5 agents, 3 levels | Three peers under one root, plus a grandchild — the case where inherited peer names used to trip governance. |
| `team-iot-telemetry.json` | 6 agents, 4 levels | Deep chain: a mid-level lead that both receives and delegates, with two specialists under it. |

Only `rootAgentId` and `agents` are required; `name` and `description` are
overridden by whatever you type in the create form. Every agent starts `idle`
with empty documents — the server creates the `principles` and `plan` slots.
