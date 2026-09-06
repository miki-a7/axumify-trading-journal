import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "../db";

const fallbackUser = {
  id: "mock-user-1",
  email: "dev@example.invalid",
  name: "Development User",
  timezone: "UTC",
  currency: "USD",
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const userIdCookie = cookieStore.get("axumify_session_user_id");

    if (userIdCookie && userIdCookie.value) {
      const user = await db.user.findUnique({
        where: { id: userIdCookie.value },
      });
      if (user) return user;
    }

    // Try Supabase auth session
    try {
      const { createClient } = await import("../supabase/server");
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        let dbUser = await db.user.findFirst({
          where: {
            OR: [{ id: data.user.id }, { email: data.user.email || "" }],
          },
        });

        if (!dbUser && data.user.email) {
          // Provision a Prisma record strictly for this authenticated Supabase user
          try {
            dbUser = await db.user.create({
              data: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email.split("@")[0] || "Trader",
                timezone: "UTC",
                currency: "USD",
              },
            });
          } catch {
            // In case record was created concurrently
            dbUser = await db.user.findUnique({ where: { id: data.user.id } });
          }
        }

        if (dbUser) return dbUser;
      }
    } catch {
      // Supabase client error
    }

    // Explicit Development-only auth fallback (NEVER activated in production)
    if (
      process.env.NODE_ENV === "development" &&
      process.env.AXUMIFY_DEV_AUTH_FALLBACK === "true"
    ) {
      const existingDevUser = await db.user.findFirst();
      if (existingDevUser) return existingDevUser;

      try {
        const defaultUser = await db.user.create({
          data: {
            email: "dev@example.invalid",
            name: "Dev Trader",
            timezone: "UTC",
            currency: "USD",
          },
        });
        return defaultUser;
      } catch {
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}
