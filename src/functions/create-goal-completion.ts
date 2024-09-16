import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

interface createGoalCompletionRequest {
  goalId: string
}

export async function createGoalCompletion({
  goalId,
}: createGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        completionCount: count(goalCompletions.id).as('completionCount'),
        goalId: goalCompletions.goalId,
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const result = await db
    .with(goalCompletionCounts)
    .select({
      completionCount: sql /*sql*/`
      COALESCE(${goalCompletionCounts.completionCount}, 0)
    `.mapWith(Number),
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already compleated this week')
  }

  const inserResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning()

  const goalCompletion = inserResult[0]

  return { goalCompletion }
}
