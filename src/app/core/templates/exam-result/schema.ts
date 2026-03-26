import { z } from 'zod'

export const examResultStudentSchema = z.object({
  tag: z.string(),
  juniorHighSchool: z.string(),
  studentName: z.string(),
  seniorHighSchool: z.string(),
  highlight: z.boolean().default(false),
})

export const examResultSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  tagline: z.string().default('耀・煜・傳・會'),
  students: z.array(examResultStudentSchema),
})

export type ExamResultStudent = z.infer<typeof examResultStudentSchema>
export type ExamResultData = z.infer<typeof examResultSchema>
