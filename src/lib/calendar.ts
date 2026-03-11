// src/lib/calendar.ts
import { createEvents, type EventAttributes } from "ics";

interface DeadlineEvent {
  title: string;
  description?: string;
  deadline: Date;
  courseTitle: string;
}

/**
 * Generate an ICS calendar file for deadlines
 */
export async function generateIcsCalendar(
  deadlines: DeadlineEvent[]
): Promise<string> {
  const events: EventAttributes[] = deadlines.map((deadline) => {
    const startDate = new Date(deadline.deadline);
    
    return {
      title: deadline.title,
      description: `${deadline.courseTitle}${deadline.description ? `\n\n${deadline.description}` : ""}`,
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      duration: { hours: 1 },
      status: "CONFIRMED" as const,
      busyStatus: "BUSY" as const,
      alarms: [
        {
          action: "display" as const,
          description: `${deadline.title} is due soon`,
          trigger: { hours: 24, before: true },
        },
        {
          action: "display" as const,
          description: `${deadline.title} is due in 1 hour`,
          trigger: { hours: 1, before: true },
        },
      ],
    };
  });

  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });
}

/**
 * Generate ICS for a single deadline
 */
export async function generateSingleEventIcs(
  event: DeadlineEvent
): Promise<string> {
  return generateIcsCalendar([event]);
}
