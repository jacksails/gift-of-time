import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/src/prisma"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get("admin_auth")?.value === "1"
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 })
  }

  const baseUrl =
    process.env.BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""

  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    })

    const header = ["firstName", "lastName", "companyName", "email", "inviteUrl"]
    const rows = clients.map((c) => {
      const inviteUrl = baseUrl ? `${baseUrl}?t=${encodeURIComponent(c.token)}` : c.token
      return [
        `"${(c.firstName || "").replace(/"/g, '""')}"`,
        `"${(c.lastName || "").replace(/"/g, '""')}"`,
        `"${(c.companyName || "").replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${inviteUrl.replace(/"/g, '""')}"`,
      ].join(",")
    })

    const csv = [header.join(","), ...rows].join("\n")
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=\"clients.csv\"",
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to export clients", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}


