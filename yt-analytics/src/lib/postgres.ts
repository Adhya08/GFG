// import { Pool } from "pg";
//
// /**
//  * Production PostgreSQL Connection Setup
//  * 
//  * To use PostgreSQL in production as defined in your FRD:
//  * 1. `npm install pg` and `npm install -D @types/pg`
//  * 2. Set your POSTGRES_CONNECTION_STRING in .env.local
//  * 3. Replace the `db.ts` imports in the API routes with this postgres pool.
//  */
//
// const pool = new Pool({
//   connectionString: process.env.POSTGRES_CONNECTION_STRING,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });
//
// // Example usage to query
// export const executePostgresQuery = async (sql: string) => {
//   const client = await pool.connect();
//   try {
//     const result = await client.query(sql);
//     return result.rows;
//   } finally {
//     client.release();
//   }
// };
//
// export default pool;
