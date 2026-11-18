export const purposes = ["打合せ", "面接", "納品", "工事", "その他"] as const;

export type Purpose = (typeof purposes)[number];

export type Employee = { id: string; name: string; department: string };

export type Visit = {
  id: string;
  code: string;
  date: string;
  time: string;
  company: string;
  name: string;
  count: number;
  companions: string;
  employeeId: string;
  purpose: Purpose;
  destination: string;
  memo: string;
  walkIn: boolean;
  cancelled: boolean;
  enteredAt: string | null;
  exitedAt: string | null;
  badge: string | null;
  returnedAt: string | null;
};

export type Notice = {
  id: string;
  visitId: string;
  createdAt: string;
  readAt: string | null;
  responderId: string | null;
};

export type Database = {
  version: 1;
  company: string;
  employees: Employee[];
  destinations: string[];
  badgeStart: number;
  badgeEnd: number;
  visits: Visit[];
  notices: Notice[];
};

export type VisitInput = Pick<
  Visit,
  | "date"
  | "time"
  | "company"
  | "name"
  | "count"
  | "companions"
  | "employeeId"
  | "purpose"
  | "destination"
  | "memo"
>;
