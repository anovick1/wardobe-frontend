import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  subWeeks,
  addWeeks,
} from "date-fns";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function WeekView({
  events = [],
  selectedDate,
  viewDate,
  onDaySelect,
  weekStart = 0,
  onWeekChange,
  wornOutfits = {},
  plannedOutfits = {},
}) {
  // weekStart: 0 = Sunday, 1 = Monday
  const baseDate = viewDate ? new Date(viewDate) : new Date();
  const weekStartDate = startOfWeek(baseDate, { weekStartsOn: weekStart });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  // Helper to get events for a day
  const getEventsForDay = (date) => {
    return events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate || e.startDate);
      // Overlap logic: event starts before end of day, and ends after start of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return start <= endOfDay && end >= startOfDay;
    });
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() =>
            onWeekChange &&
            onWeekChange(format(addWeeks(weekStartDate, -1), "yyyy-MM-dd"))
          }
        >
          <Icon name="chevron-left" size={24} color="#121416" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {format(weekStartDate, "MMMM yyyy")}
        </Text>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() =>
            onWeekChange &&
            onWeekChange(format(addWeeks(weekStartDate, 2), "yyyy-MM-dd"))
          }
        >
          <Icon name="chevron-right" size={24} color="#121416" />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {days.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isSelected =
            selectedDate && isSameDay(day, parseISO(selectedDate));
          const dayEvents = getEventsForDay(day);
          const dayWornOutfits = wornOutfits[dayStr] || [];
          const dayPlannedOutfits = plannedOutfits[dayStr] || [];
          
          return (
            <TouchableOpacity
              key={dayStr}
              style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              onPress={() => onDaySelect && onDaySelect(dayStr)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.dayText, isSelected && styles.dayTextSelected]}
              >
                {format(day, "EEE")}
              </Text>
              <Text
                style={[styles.dayNum, isSelected && styles.dayTextSelected]}
              >
                {format(day, "d")}
              </Text>
              
              {/* Activity indicators */}
              <View style={styles.indicators}>
                {dayEvents.length > 0 && <Text style={styles.eventDot}>●</Text>}
                {dayWornOutfits.length > 0 && <Text style={styles.wornDot}>●</Text>}
                {dayPlannedOutfits.length > 0 && <Text style={styles.plannedDot}>●</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#121416",
  },
  arrowBtn: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dayPill: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 2,
    minWidth: 38,
  },
  dayPillSelected: {
    backgroundColor: "#121416",
  },
  dayText: {
    fontSize: 13,
    color: "#121416",
    fontWeight: "500",
  },
  dayNum: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
  },
  dayTextSelected: {
    color: "#fff",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    minHeight: 12,
  },
  eventDot: {
    fontSize: 8,
    color: "#f59e0b",
    fontWeight: "bold",
    marginHorizontal: 1,
  },
  wornDot: {
    fontSize: 8,
    color: "#10b981",
    fontWeight: "bold",
    marginHorizontal: 1,
  },
  plannedDot: {
    fontSize: 8,
    color: "#3b82f6",
    fontWeight: "bold",
    marginHorizontal: 1,
  },
});
