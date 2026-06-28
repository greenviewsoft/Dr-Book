import { Query, Functions } from "appwrite";
import { db, client } from "@/lib/appwrite";
import { DB_ID, TABLES, BOOK_FUNCTION_ID } from "@/lib/constants";

// ---- Public reads (these tables must have Read permission = Any) ----

export async function getDoctorConfig() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    queries: [Query.limit(1)],
  });
  return rows[0] || null;
}

export async function getHolidays() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    queries: [Query.limit(500)],
  });
  return rows; // [{ date, reason }]
}

export async function getCounter(date) {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.daily_counters,
    queries: [Query.equal("date", date), Query.limit(1)],
  });
  return rows[0] || null; // { date, next_serial }
}

// ---- Booking via Appwrite Function (server-side, secure) ----
// Throws { code } on failure; code is one of: NOT_WORKING_DAY, HOLIDAY,
// PAST_DATE, NO_SLOTS, DUPLICATE, INVALID_INPUT, CONFIG_MISSING, FAILED.
export async function bookAppointment(payload) {
  if (!BOOK_FUNCTION_ID) {
    throw { code: "FAILED" };
  }
  const functions = new Functions(client);
  const exec = await functions.createExecution(
    BOOK_FUNCTION_ID,
    JSON.stringify(payload),
    false, // synchronous
    "/api/book",
    "POST",
    { "Content-Type": "application/json" }
  );

  const data = safeParse(exec.responseBody);
  if (exec.responseStatus >= 400 || !data || data.ok === false) {
    throw { code: data?.error || "FAILED", message: data?.message };
  }
  return data; // { ok, serial, date, displayTime }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
