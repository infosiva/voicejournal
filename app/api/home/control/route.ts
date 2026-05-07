import { NextRequest, NextResponse } from 'next/server'
import { haCallService, haGetState, isConfigured } from '@/lib/homeAssistant'
import { MOCK_DEVICES, ParsedCommand } from '@/lib/voiceProcessor'

export async function POST(req: NextRequest) {
  try {
    const command: ParsedCommand = await req.json()

    if (!isConfigured()) {
      // Mock mode
      const mock = MOCK_DEVICES[command.entityId]
      return NextResponse.json({
        success: true,
        mock: true,
        message: `[DEMO] Would ${command.action.replace('_', ' ')} ${command.friendlyName}`,
        state: mock?.state ?? 'unknown',
      })
    }

    switch (command.action) {
      case 'turn_on':
        await haCallService(command.domain, 'turn_on', { entity_id: command.entityId })
        break
      case 'turn_off':
        await haCallService(command.domain, 'turn_off', { entity_id: command.entityId })
        break
      case 'set_temperature':
        await haCallService('climate', 'set_temperature', {
          entity_id: command.entityId,
          temperature: command.value,
        })
        break
      case 'lock':
        await haCallService('lock', 'lock', { entity_id: command.entityId })
        break
      case 'unlock':
        await haCallService('lock', 'unlock', { entity_id: command.entityId })
        break
      case 'get_state': {
        const state = await haGetState(command.entityId)
        return NextResponse.json({ success: true, state: state.state, attributes: state.attributes })
      }
    }

    return NextResponse.json({ success: true, mock: false })
  } catch (e: unknown) {
    console.error('[control]', e)
    return NextResponse.json({ error: 'Home control failed' }, { status: 500 })
  }
}
