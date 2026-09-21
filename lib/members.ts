export const members = ["大魔王", "小魔王"] as const;
export type Member = (typeof members)[number];

export function isMember(value: unknown): value is Member {
  return typeof value === "string" && (members as readonly string[]).includes(value);
}

// Messages written before the 魔族小窝 rename are kept readable.
export function normaliseMember(value: unknown): Member | null {
  if (value === "大魔王" || value === "魔王") return "大魔王";
  if (value === "小魔王" || value === "思怡") return "小魔王";
  return null;
}

export function otherMember(member: Member): Member {
  return member === "大魔王" ? "小魔王" : "大魔王";
}
