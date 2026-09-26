import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  if (!requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"])) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {

    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.*,
        b.branch_name,
        b.branch_code,
        a.first_name AS agent_first_name,
        a.last_name AS agent_last_name,
        a.agent_code
      FROM customer c
      LEFT JOIN branch b 
        ON c.branch_id = b.branch_id
      LEFT JOIN agent a 
        ON c.agent_id = a.agent_id
      WHERE c.customer_id = ?
      `,
      [id]
    );


    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Customer not found." },
        { status: 404 }
      );
    }


    return NextResponse.json(rows[0]);


  } catch (error) {

    console.error("Fetch customer error:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );

  }

}



export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  if (!requireRole(request, ["ADMIN", "AGENT"])) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }


  const { id } = await params;

  const body = await request.json();


  const {
    first_name,
    last_name,
    phone,
    email,
    address,
    status
  } = body;


  if (
    status !== undefined &&
    status !== "ACTIVE" &&
    status !== "INACTIVE"
  ) {

    return NextResponse.json(
      {
        message: "Invalid status. Must be ACTIVE or INACTIVE."
      },
      {
        status: 400
      }
    );

  }


  try {

    const pool = getDbPool();


    const [result] = await pool.execute<ResultSetHeader>(
      `
      UPDATE customer
      SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
      WHERE customer_id = ?
      `,
      [
        first_name ?? null,
        last_name ?? null,
        phone ?? null,
        email ?? null,
        address ?? null,
        status ?? null,
        id
      ]
    );


    if (result.affectedRows === 0) {

      return NextResponse.json(
        { message: "Customer not found." },
        { status: 404 }
      );

    }


    return NextResponse.json(
      {
        message: "Customer updated successfully.",
        customerId: id
      }
    );


  } catch (error) {

    console.error("Update customer error:", error);

    return NextResponse.json(
      { message: "Failed to update customer." },
      { status: 500 }
    );

  }

}