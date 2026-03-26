import { z } from 'zod'

export const examResultStudentSchema = z.object({
  subject: z.string(),
  juniorHighSchool: z.string(),
  studentName: z.string(),
  seniorHighSchool: z.string(),
})

export const examResultSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(''),
  students: z.array(examResultStudentSchema),
})

export type ExamResultStudent = z.infer<typeof examResultStudentSchema>
export type ExamResultData = z.infer<typeof examResultSchema>
