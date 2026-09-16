import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

/*
  IMPORTANT:
  Do not hide SQL in an ORM or application-memory workaround.
  Database operations belong in explicit TODO sections in the API/service layer.
*/
