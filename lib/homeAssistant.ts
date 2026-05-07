const HA_URL   = process.env.HA_URL
const HA_TOKEN = process.env.HA_TOKEN

export interface HAState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
}

export async function haGetState(entityId: string): Promise<HAState> {
  if (!HA_URL || !HA_TOKEN) throw new Error('Home Assistant not configured')
  const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: { Authorization: `Bearer ${HA_TOKEN}` },
  })
  if (!res.ok) throw new Error(`HA get state failed: ${res.status}`)
  return res.json()
}

export async function haCallService(
  domain: string,
  service: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!HA_URL || !HA_TOKEN) throw new Error('Home Assistant not configured')
  const res = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HA service call failed: ${res.status}`)
}

export function isConfigured(): boolean {
  return !!(HA_URL && HA_TOKEN)
}
