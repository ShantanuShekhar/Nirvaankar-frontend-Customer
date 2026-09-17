export type SduiSection = {
  id: string
  componentType: string
  props?: Record<string, unknown>
  dataSource?: Record<string, unknown>
  schemaVersion?: number
}

export type SduiScreen = {
  key: string
  schemaVersion: number
  sections: SduiSection[]
}
