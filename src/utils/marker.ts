import type { MarkerType } from '../types'

export interface MarkerTypeOption {
  type: MarkerType
  emoji: string
  label: string
}

/** 所有 Marker 类型的固定展示文案，避免不同页面出现不一致的名称。 */
export const MARKER_TYPE_OPTIONS: MarkerTypeOption[] = [
  { type: 'emotion', emoji: '🔥', label: '情绪爆发' },
  { type: 'music', emoji: '🎵', label: '音乐节点' },
  { type: 'shot', emoji: '🎬', label: '镜头设计' },
  { type: 'dialogue', emoji: '💬', label: '台词' },
  { type: 'transition', emoji: '⚡', label: '转场' },
  { type: 'favorite', emoji: '⭐', label: '必剪' },
  { type: 'custom', emoji: '📌', label: '自定义' },
]

/** 读取指定类型的展示信息，供快捷按钮和时间轴共用。 */
export function getMarkerTypeOption(type: MarkerType): MarkerTypeOption {
  return MARKER_TYPE_OPTIONS.find((option) => option.type === type) ?? MARKER_TYPE_OPTIONS[0]
}
