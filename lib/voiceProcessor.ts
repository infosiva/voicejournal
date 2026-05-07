import { callAI } from './ai'

export interface ParsedCommand {
  action: 'turn_on' | 'turn_off' | 'set_temperature' | 'get_state' | 'lock' | 'unlock' | 'unknown'
  domain: string        // 'light', 'climate', 'lock', 'switch'
  entityId: string      // e.g. 'light.living_room'
  friendlyName: string  // e.g. 'living room lights'
  value?: number        // for temperature
  response: string      // what to say back
}

const SYSTEM = `You are a smart home voice assistant. Parse voice commands into structured actions.
Respond with valid JSON only, no markdown.`

export async function parseVoiceCommand(transcript: string): Promise<ParsedCommand> {
  const prompt = `Parse this smart home command: "${transcript}"

Respond with JSON:
{
  "action": "turn_on|turn_off|set_temperature|get_state|lock|unlock|unknown",
  "domain": "light|climate|lock|switch",
  "entityId": "domain.room_name (e.g. light.living_room)",
  "friendlyName": "human readable name",
  "value": null or number (for temperature),
  "response": "what the assistant should say back"
}`

  try {
    const { text } = await callAI(SYSTEM, [{ role: 'user', content: prompt }], 512, 'fast')
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      action: 'unknown',
      domain: 'switch',
      entityId: 'switch.unknown',
      friendlyName: 'unknown device',
      response: "Sorry, I didn't understand that command. Please try again.",
    }
  }
}

// Mock state for demo mode (when HA not configured)
export const MOCK_DEVICES: Record<string, { state: string; friendly_name: string }> = {
  'light.living_room':  { state: 'on',  friendly_name: 'Living Room Lights' },
  'light.bedroom':      { state: 'off', friendly_name: 'Bedroom Lights' },
  'light.kitchen':      { state: 'on',  friendly_name: 'Kitchen Lights' },
  'climate.living_room':{ state: '72',  friendly_name: 'Living Room Thermostat' },
  'lock.front_door':    { state: 'locked', friendly_name: 'Front Door Lock' },
}
