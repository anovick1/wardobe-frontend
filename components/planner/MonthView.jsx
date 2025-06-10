import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MonthView({
  events = [],
  selectedDate,
  viewDate,
  onDaySelect,
  onMonthChange,
}) {
  // Use viewDate to determine which month to display

  const baseDate = viewDate ? new Date(viewDate) : new Date();
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }
  // Ensure days.length is a multiple of 7 (remove any extra day)
  if (days.length % 7 !== 0) {
    days.splice(-(days.length % 7));
  }
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  // Helper to get events for a day
  const getEventsForDay = (date) => {
    const dayEvents = events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate || e.startDate);
      return date >= start && date <= end;
    });
    return dayEvents;
  };
  const monthLabel = format(monthStart, "MMMM yyyy");
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[
            styles.arrowBtn,
            { position: "absolute", left: 0, zIndex: 1 },
          ]}
          onPress={() =>
            onMonthChange &&
            onMonthChange(format(addMonths(monthStart, -1), "yyyy-MM-dd"))
          }
        >
          <Icon name="chevron-left" size={24} color="#121416" />
        </TouchableOpacity>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={styles.monthHeader}>{monthLabel}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.arrowBtn,
            { position: "absolute", right: 0, zIndex: 1 },
          ]}
          onPress={() =>
            onMonthChange &&
            onMonthChange(format(addMonths(monthStart, 2), "yyyy-MM-dd"))
          }
        >
          <Icon name="chevron-right" size={24} color="#121416" />
        </TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={{ flexDirection: "row", width: "100%" }}>
            {week.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isSelected =
                selectedDate && isSameDay(day, parseISO(selectedDate));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const dayEvents = getEventsForDay(day);
              return (
                <TouchableOpacity
                  key={dayStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !isCurrentMonth && styles.dayCellOtherMonth,
                    { flex: 1 },
                  ]}
                  onPress={() => onDaySelect && onDaySelect(dayStr)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      !isCurrentMonth && styles.dayNumOtherMonth,
                    ]}
                  >
                    {format(day, "d")}
                  </Text>
                  {dayEvents.length > 0 && (
                    <Text style={styles.eventDot}>●</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#121416",
  },
  arrowBtn: {
    padding: 4,
  },
  weekRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    color: "#6a7681",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "center",
  },
  dayCell: {
    width: 38,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    margin: 2,
  },
  dayCellSelected: {
    backgroundColor: "#121416",
  },
  dayCellOtherMonth: {
    backgroundColor: "#fff",
    opacity: 0.5,
  },
  dayNum: {
    fontSize: 15,
    color: "#121416",
    fontWeight: "500",
  },
  dayNumSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayNumOtherMonth: {
    color: "#b0b0b0",
  },
  eventDot: {
    fontSize: 11,
    color: "#1877f3",
    marginTop: 2,
    fontWeight: "bold",
  },
});
