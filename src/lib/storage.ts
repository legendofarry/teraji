export const STORAGE_BUCKETS = {
  avatars: "avatars",
  logos: "logos",
  attachments: "attachments",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
