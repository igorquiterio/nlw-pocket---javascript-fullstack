import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm'

dayjs.extend(weekOfYear)

export async function getWeekSummary() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(
        and(
          gte(goals.createdAt, firstDayOfWeek),
          lte(goals.createdAt, lastDayOfWeek)
        )
      )
  )

  const goalsCompleteatedInWeek = db.$with('goals_compleated_in_week').as(
    db
      .select({
        id: goalCompletions.id,
        title: goals.title,
        completedAt: goalCompletions.createdAt,
        completedAtDate: sql /*sql*/`
          DATE(${goalCompletions.createdAt})
        `.as('CompletedAtDate'),
      })
      .from(goalCompletions)
      .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .orderBy(desc(goalCompletions.createdAt))
  )

  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week').as(
    db
      .select({
        completedAtDate: goalsCompleteatedInWeek.completedAtDate,
        completion: sql /*sql*/`
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ${goalsCompleteatedInWeek.id},
                'title', ${goalsCompleteatedInWeek.title},
                'compleatedAt', ${goalsCompleteatedInWeek.completedAt}
              )
            )
          `.as('completions'),
      })
      .from(goalsCompleteatedInWeek)
      .groupBy(goalsCompleteatedInWeek.completedAtDate)
      .orderBy(desc(goalsCompleteatedInWeek.completedAtDate))
  )

  type GoalsPerDay = Record<
    string,
    {
      id: string
      title: string
      completedAt: string
    }[]
  >

  const result = await db
    .with(
      goalsCreatedUpToWeek,
      goalsCompleteatedInWeek,
      goalsCompletedByWeekDay
    )
    .select({
      completed: sql /*sql*/`
        (SELECT COUNT(*) FROM ${goalsCompletedByWeekDay})
      `.mapWith(Number),
      total: sql /*sql*/`
      (SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})
    `.mapWith(Number),
      goalsPerDay: sql /*sql*/<GoalsPerDay>`
        JSON_OBJECT_AGG(
          ${goalsCompletedByWeekDay.completedAtDate},${goalsCompletedByWeekDay.completion}
        )
      `,
    })
    .from(goalsCompletedByWeekDay)

  return {
    summary: result[0],
  }
}
