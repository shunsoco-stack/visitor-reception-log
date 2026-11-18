"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearMessage, useApp } from "./app-provider";
import { Icon } from "./icons";

const navigation = [
  ["/", "home", "今日の来訪"],
  ["/visits", "calendar", "来訪予約"],
  ["/log", "log", "入退館記録"],
  ["/notices", "bell", "来訪通知"],
  ["/settings", "settings", "設定"],
  ["/backup", "backup", "バックアップ"],
  ["/about", "info", "このデモについて"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, now, message } = useApp();
  const unread = data?.notices.filter((notice) => !notice.readAt).length ?? 0;
  if (pathname === "/kiosk") return <>{children}</>;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Icon name="people" />
          </span>
          <span>
            AOZORA<span className="brand-sub">VISITOR RECEPTION</span>
          </span>
        </Link>
        <p className="nav-label">受付管理</p>
        <nav aria-label="メインナビゲーション">
          {navigation.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname === href || (href === "/visits" && pathname.startsWith("/visits/")) ? "active" : ""}`}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {href === "/notices" && unread > 0 && <b className="nav-count">{unread}</b>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className="kiosk-link" href="/kiosk" target="_blank">
            <Icon name="tablet" />
            受付画面を開く
            <Icon name="arrow" size={16} />
          </Link>
          <small>あおぞらシステムズ 本社（架空）</small>
          <span className="demo-tag">デモ用の架空データです</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-title">来客受付・入退館記録</span>
          <div className="topbar-right">
            <span className="live-dot" />
            <span className="local-label">このブラウザに保存</span>
            <Link href="/notices" className="bell-button" aria-label={`来訪通知 未読${unread}件`}>
              <Icon name="bell" />
              {unread > 0 && <span>{unread}</span>}
            </Link>
            <div className="avatar">総</div>
          </div>
        </header>
        <main className="main-content">
          <div className="mobile-demo">デモ用の架空データです</div>
          {message && (
            <div className="toast" role="status">
              <span>{message}</span>
              <button onClick={clearMessage} aria-label="メッセージを閉じる">
                ×
              </button>
            </div>
          )}
          {!data || !now ? (
            <div className="empty">{message || "受付データを準備しています…"}</div>
          ) : (
            children
          )}
        </main>
        <footer className="footer">
          AOZORA RECEPTION <span>デモ用の架空データです · 日本時間（JST）</span>
        </footer>
      </div>
      <nav className="mobile-tabs" aria-label="モバイルナビゲーション">
        {navigation.slice(0, 5).map(([href, icon, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            <Icon name={icon} size={20} />
            <span>{label.replace("来訪", "")}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
