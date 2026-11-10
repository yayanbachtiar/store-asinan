import type { Member } from "../types";
import { createDoc, findOne, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "members";
type MemberData = Omit<Member, "id" | "createdAt">;

const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, "id");

export async function listMembers(): Promise<Member[]> {
  return (await listDocs<MemberData>(COLLECTION)).sort(byName);
}

export async function getMember(id: string): Promise<Member | null> {
  return getDoc<MemberData>(COLLECTION, id);
}

/** Whitelist login: cari anggota dari email Google (huruf kecil semua). */
export async function findMemberByEmail(email: string): Promise<Member | null> {
  return findOne<MemberData>(COLLECTION, "email", email.toLowerCase());
}

export async function findMemberByTelegramId(telegramId: string): Promise<Member | null> {
  return findOne<MemberData>(COLLECTION, "telegramId", telegramId);
}

/** Bendahara = anggota pertama dengan role "bendahara". */
export async function getTreasurer(): Promise<Member | null> {
  return findOne<MemberData>(COLLECTION, "role", "bendahara");
}

export async function createMember(data: MemberData): Promise<Member> {
  return createDoc<MemberData>(COLLECTION, data);
}

export async function updateMember(id: string, data: Partial<MemberData>): Promise<Member | null> {
  return updateDoc<MemberData>(COLLECTION, id, data);
}
