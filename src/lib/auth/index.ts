import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "../db";

const fallbackUser = {
  id: "mock-user-1",
  email: "trader@axumify.com",
  name: "Oriyon Trades",
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

    if (!userIdCookie || !userIdCookie.value) {
      try {
        const firstUser = await db.user.findFirst();
        return firstUser || fallbackUser;
      } catch {
        return fallbackUser;
      }
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userIdCookie.value },
      });
      return user || fallbackUser;
    } catch {
      return fallbackUser;
    }
  } catch {
    return fallbackUser;
  }
}
