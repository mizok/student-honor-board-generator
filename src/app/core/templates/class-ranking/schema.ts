import { z } from 'zod'

export const rankingEntrySchema = z.object({
  rank: z.number().int().positive(),
  classNumber: z.string(),
  studentName: z.string(),
})

export const classRankingSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  schoolRankings: z.array(rankingEntrySchema),
  classRankings: z.array(rankingEntrySchema),
})

export type RankingEntry = z.infer<typeof rankingEntrySchema>
export type ClassRankingData = z.infer<typeof classRankingSchema>
