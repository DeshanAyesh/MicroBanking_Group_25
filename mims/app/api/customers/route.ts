import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import { hashPassword } from "@/lib/auth/password";
import { ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {

  if (!requireRole(request, ["ADMIN","AGENT"])) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const pool = getDbPool();

    const [rows] = await pool.query(`
      SELECT 
        c.customer_id,
        c.nic,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        c.status,
        b.branch_name,
        a.first_name AS agent_first_name,
        a.last_name AS agent_last_name
      FROM customer c
      LEFT JOIN branch b 
        ON c.branch_id = b.branch_id
      LEFT JOIN agent a 
        ON c.agent_id = a.agent_id
    `);

    return NextResponse.json(rows);

  } catch (error) {

    console.error("Fetch customers error:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );

  }

}

export async function POST(request: NextRequest) {

  if (!requireRole(request, ["ADMIN","AGENT"])) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();

  const {
    username,
    password,
    branch_id,
    agent_id,
    nic,
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    email,
    address
  } = body;


  if (
    !username ||
    !password ||
    !branch_id ||
    !agent_id ||
    !nic ||
    !first_name ||
    !last_name ||
    !date_of_birth ||
    !gender
  ) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }


  const pool = getDbPool();

  const connection = await pool.getConnection();


  try {

    await connection.beginTransaction();


    const hashedPassword = await hashPassword(password);


    const [userResult] =
      await connection.execute<ResultSetHeader>(
        `
        INSERT INTO user_account
        (
          role_id,
          username,
          password_hash
        )
        VALUES (?, ?, ?)
        `,
        [
          3,
          username,
          hashedPassword
        ]
      );


    const userId = userResult.insertId;


    const [customerResult] =
      await connection.execute<ResultSetHeader>(
        `
        INSERT INTO customer
        (
          user_id,
          branch_id,
          agent_id,
          nic,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email,
          address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          branch_id,
          agent_id,
          nic,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone || null,
          email || null,
          address || null
        ]
      );


    await connection.commit();


    return NextResponse.json(
      {
        message: "Customer created successfully.",
        customerId: customerResult.insertId
      },
      { status: 201 }
    );


  } catch (error: any) {


    await connection.rollback();


    console.error("Create customer error:", error);


    if (error.code === "ER_DUP_ENTRY") {

      return NextResponse.json(
        {
          message: "Username or NIC already exists."
        },
        {
          status: 409
        }
      );

    }


    return NextResponse.json(
      {
        message: "Failed to create customer."
      },
      {
        status: 500
      }
    );


  } finally {

    connection.release();

  }

}