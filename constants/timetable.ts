export type TimetableEntry = {
  _id?: string;
  day: string;
  subjectId?: string;
  subjectName: string;
  facultyId?: string;
  startTime: string;
  endTime: string;
  room?: string;
};

export type TimetableGroup = {
  day: string;
  items: TimetableEntry[];
};

export type ScheduleRow =
  | {
      kind: 'lecture';
      key: string;
      entry: TimetableEntry;
    }
  | {
      kind: 'break';
      key: string;
      label: string;
      startTime: string;
      endTime: string;
    }
  | {
      kind: 'free';
      key: string;
      label: string;
      startTime: string;
      endTime: string;
    };

export const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const collegeDaySlots = [
  { kind: 'lecture', startTime: '09:00', endTime: '10:00', displayStart: '9:00 AM', displayEnd: '10:00 AM' },
  { kind: 'lecture', startTime: '10:00', endTime: '11:00', displayStart: '10:00 AM', displayEnd: '11:00 AM' },
  { kind: 'break', startTime: '11:00', endTime: '11:15', displayStart: '11:00 AM', displayEnd: '11:15 AM', label: 'Short break' },
  { kind: 'lecture', startTime: '11:15', endTime: '12:15', displayStart: '11:15 AM', displayEnd: '12:15 PM' },
  { kind: 'break', startTime: '12:15', endTime: '01:00', displayStart: '12:15 PM', displayEnd: '1:00 PM', label: 'Lunch break' },
  { kind: 'lecture', startTime: '01:00', endTime: '02:00', displayStart: '1:00 PM', displayEnd: '2:00 PM' },
  { kind: 'lecture', startTime: '02:00', endTime: '03:00', displayStart: '2:00 PM', displayEnd: '3:00 PM' },
] as const;

function getSlotIndex(startTime: string, endTime?: string) {
  return collegeDaySlots.findIndex(
    (slot) => slot.startTime === startTime && (typeof endTime === 'undefined' || slot.endTime === endTime)
  );
}

export function formatCollegeTime(value: string) {
  const matchingSlot =
    collegeDaySlots.find((slot) => slot.startTime === value) ||
    collegeDaySlots.find((slot) => slot.endTime === value);

  if (!matchingSlot) {
    return value;
  }

  if (matchingSlot.startTime === value) {
    return matchingSlot.displayStart;
  }

  return matchingSlot.displayEnd;
}

export function formatCollegeRange(startTime: string, endTime: string) {
  return `${formatCollegeTime(startTime)} - ${formatCollegeTime(endTime)}`;
}

export function getCurrentDayName() {
  const currentDayIndex = new Date().getDay();

  if (currentDayIndex === 0) {
    return 'Sunday';
  }

  return weekdayOrder[currentDayIndex - 1];
}

export function groupTimetableByDay(timetable: TimetableEntry[]) {
  const grouped = timetable.reduce<Record<string, TimetableEntry[]>>((accumulator, item) => {
    if (!accumulator[item.day]) {
      accumulator[item.day] = [];
    }

    accumulator[item.day].push(item);
    return accumulator;
  }, {});

  return weekdayOrder.filter((day) => grouped[day]?.length).map((day) => ({
    day,
    items: grouped[day]
      .slice()
      .sort((first, second) => getSlotIndex(first.startTime, first.endTime) - getSlotIndex(second.startTime, second.endTime)),
  }));
}

export function getPreviewGroups(groups: TimetableGroup[], today: string, count = 3) {
  if (!groups.length) {
    return [];
  }

  const startIndex = weekdayOrder.indexOf(today);
  const orderedDays =
    startIndex >= 0
      ? [...weekdayOrder.slice(startIndex), ...weekdayOrder.slice(0, startIndex)]
      : weekdayOrder;

  return orderedDays.map((day) => groups.find((group) => group.day === day)).filter(Boolean).slice(0, count) as TimetableGroup[];
}

export function buildScheduleRows(entries: TimetableEntry[], day: string) {
  const rows: ScheduleRow[] = [];

  collegeDaySlots.forEach((slot) => {
    if (slot.kind === 'break') {
      rows.push({
        kind: 'break',
        key: `${day}-${slot.startTime}-${slot.endTime}-break`,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      return;
    }

    const matchingEntry = entries.find(
      (entry) => entry.startTime === slot.startTime && entry.endTime === slot.endTime
    );

    if (matchingEntry) {
      rows.push({
        kind: 'lecture',
        key: matchingEntry._id || `${day}-${matchingEntry.subjectId}-${matchingEntry.startTime}`,
        entry: matchingEntry,
      });
      return;
    }

    rows.push({
      kind: 'free',
      key: `${day}-${slot.startTime}-${slot.endTime}-free`,
      label: 'Free period',
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  });

  return rows;
}
