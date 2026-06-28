// Appwrite identifiers. Set DB_ID and BOOK_FUNCTION_ID in your .env file.
export const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;

export const TABLES = {
  doctors: "doctors",
  holidays: "holidays",
  appointments: "appointments",
  daily_counters: "daily_counters",
};

// Appwrite Function that handles secure public booking (Execute = Any).
export const BOOK_FUNCTION_ID = import.meta.env.VITE_BOOK_FUNCTION_ID || "";

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
