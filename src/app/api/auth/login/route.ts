import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Try Supabase Auth
    const supabase = createClient();
    const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let authenticatedUserId: string | null = null;
    let authenticatedUserEmail: string | null = null;

    if (!supaError && supaData.user) {
      authenticatedUserId = supaData.user.id;
      authenticatedUserEmail = supaData.user.email || email;
    }

    // 2. Fallback / Sync with Prisma db.user
    let dbUser = await db.user.findUnique({ where: { email } });

    if (!dbUser && authenticatedUserEmail) {
      dbUser = await db.user.findUnique({ where: { email: authenticatedUserEmail } });
    }

    if (dbUser && dbUser.passwordHash && !authenticatedUserId) {
      const isValid = await comparePassword(password, dbUser.passwordHash);
      if (isValid) {
        authenticatedUserId = dbUser.id;
      }
    }

    if (!dbUser && authenticatedUserId) {
      dbUser = await db.user.create({
        data: {
          id: authenticatedUserId,
          email,
          name: email.split("@")[0],
        },
      });
    }

    if (!dbUser && !authenticatedUserId) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const userId = dbUser ? dbUser.id : authenticatedUserId!;
    const cookieStore = cookies();
    cookieStore.set("axumify_session_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
  }
}
