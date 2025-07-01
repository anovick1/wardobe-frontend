export const mapEventsForApi = (events) =>
  events.map((event) => ({
    title: event.title,
    start_iso: new Date(event.startDate).toISOString(),
    end_iso: new Date(event.endDate ?? event.startDate).toISOString(),
    location: event.location ?? "",
  }));
