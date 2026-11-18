"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { VisitDetail } from "@/components/visit-detail";

export default function NotFound() {
  const pathname = usePathname();
  if (/^\/visits\/[^/]+\/?$/.test(pathname)) return <VisitDetail />;
  return (
    <div className="empty">
      <h1>ページが見つかりません</h1>
      <Link className="button primary" href="/">
        今日の来訪へ
      </Link>
    </div>
  );
}
