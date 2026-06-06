import bcrypt from "bcryptjs";

export async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
