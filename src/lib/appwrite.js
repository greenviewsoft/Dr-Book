import { Client, Account, TablesDB } from "appwrite";

// Single shared client (session + TablesDB use the same instance)
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const db = new TablesDB(client);

export { client, account, db };
