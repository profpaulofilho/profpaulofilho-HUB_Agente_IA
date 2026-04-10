export const DEFAULT_TEMP_PASSWORD =
  process.env.DEFAULT_TEMP_PASSWORD?.trim() || 'senai@123'

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.APP_URL?.trim() ||
  'http://localhost:3000'
