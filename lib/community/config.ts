export const COMMUNITY_FEED_PAGE_SIZE = 12

export const COMMUNITY_REACTIONS = [
  { type: 'celebrate', emoji: '👏', label: 'Applaud' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'insightful', emoji: '🤯', label: 'Mind blown' },
] as const

export type CommunityReactionType = (typeof COMMUNITY_REACTIONS)[number]['type']
export type CommunityTierFilter = 'all' | 'tier1' | 'tier2' | 'tier3'
export type CommunitySort = 'newest' | 'top-scored'
export type CommunityMinScore = 0 | 60 | 75 | 90
export type CommunityFlagReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'misinformation'
  | 'other'

export interface CommunityViewer {
  userId: string | null
  username: string | null
  communityStatus: string | null
  evaluatedProjectCount: number
  canReact: boolean
  canComment: boolean
  isEvaluator: boolean
}

export interface CommunityFeedItem {
  projectId: string
  title: string
  description: string | null
  techStack: string[]
  liveUrl: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  score: number
  tier: string
  evaluatedAt: string
  reviewerNote: string
  reactionCount: number
  commentCount: number
  reactionCounts: Record<CommunityReactionType, number>
  userReaction: CommunityReactionType | null
}

export interface CommunityFeedResponse {
  items: CommunityFeedItem[]
  nextCursor: number | null
}

export interface ProjectComment {
  id: string
  body: string
  createdAt: string
  isEdited: boolean
  replyCount: number
  parentCommentId: string | null
  status: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  userId: string
  flaggedByViewer: boolean
  replies: ProjectComment[]
}

export interface ProjectCommentsResponse {
  comments: ProjectComment[]
}

export interface FlaggedCommentItem {
  id: string
  body: string
  status: string
  createdAt: string
  flagCount: number
  projectId: string
  projectTitle: string | null
  projectOwnerUsername: string | null
  authorUsername: string | null
  authorDisplayName: string | null
}

export function isCommunityTierFilter(value: string | null): value is CommunityTierFilter {
  return value === 'all' || value === 'tier1' || value === 'tier2' || value === 'tier3'
}

export function isCommunitySort(value: string | null): value is CommunitySort {
  return value === 'newest' || value === 'top-scored'
}

export function isCommunityReactionType(value: string | null): value is CommunityReactionType {
  return COMMUNITY_REACTIONS.some((reaction) => reaction.type === value)
}

export function isCommunityFlagReason(value: string | null): value is CommunityFlagReason {
  return (
    value === 'spam' ||
    value === 'harassment' ||
    value === 'inappropriate' ||
    value === 'misinformation' ||
    value === 'other'
  )
}

export function parseCommunityMinScore(value: string | null): CommunityMinScore {
  if (value === '60') return 60
  if (value === '75') return 75
  if (value === '90') return 90
  return 0
}
