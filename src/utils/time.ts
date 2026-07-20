/** 将经过秒数转换为 HH:mm:ss，供计时器和 Marker 共用。 */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

/** 将 HH:mm:ss 文本解析为秒数；格式或分钟、秒数无效时返回 null。 */
export function parseTime(timeText: string): number | null {
  const matches = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(timeText.trim())

  if (!matches) {
    return null
  }

  const [, hours, minutes, seconds] = matches
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}
