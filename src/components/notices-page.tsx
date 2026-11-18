"use client";

import { useState } from "react";
import { useApp, mutate } from "./app-provider";
import { acknowledge, overdue } from "@/lib/notices";
import { PageHeading, Empty } from "./ui";
import { Icon } from "./icons";

export function NoticesPage() {
  const { data, now } = useApp();
  const [responder, setResponder] = useState("employee-0");
  const [filter, setFilter] = useState("unread");
  const [employee, setEmployee] = useState("");
  if (!data) return null;
  const notices = data.notices
    .filter(
      (notice) =>
        (filter === "all" || !notice.readAt) &&
        (!employee ||
          data.visits.find((visit) => visit.id === notice.visitId)?.employeeId === employee),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeading
        eyebrow="ARRIVAL NOTIFICATIONS"
        title="来訪通知"
        description="来訪者が到着したら、担当者が対応を記録します。通知はこのアプリ内のみです。"
      />
      <section className="panel">
        <div className="filters">
          <label>
            対応を記録する社員
            <select value={responder} onChange={(event) => setResponder(event.target.value)}>
              {data.employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}（{item.department}）
                </option>
              ))}
            </select>
          </label>
          <label>
            宛先担当者
            <select value={employee} onChange={(event) => setEmployee(event.target.value)}>
              <option value="">すべての担当者</option>
              {data.employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            表示
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="unread">未対応のみ</option>
              <option value="all">対応済みを含む</option>
            </select>
          </label>
        </div>
        <div className="notice-list">
          {notices.length ? (
            notices.map((notice) => {
              const visit = data.visits.find((item) => item.id === notice.visitId)!;
              const delayed = overdue(notice, now);
              return (
                <article
                  className={`notice-card ${delayed ? "notice-delayed" : ""}`}
                  key={notice.id}
                >
                  <div className="notice-symbol">
                    <Icon name="bell" />
                  </div>
                  <div className="notice-content">
                    <div className="notice-meta">
                      <span>
                        {notice.readAt
                          ? "対応済み"
                          : delayed
                            ? "5分以上未対応 · 総務で取次ぎ"
                            : "新しい来訪"}
                      </span>
                      <time>{notice.createdAt.replace("T", " ").slice(0, 16)}</time>
                    </div>
                    <h2>
                      {visit.name}様（{visit.company}）がロビーに到着
                    </h2>
                    <p>
                      担当：{data.employees.find((item) => item.id === visit.employeeId)?.name} ·{" "}
                      {visit.destination} · {visit.count}名
                    </p>
                    {notice.readAt ? (
                      <small>
                        対応者：
                        {
                          data.employees.find((item) => item.id === notice.responderId)?.name
                        } ／ {notice.readAt.replace("T", " ").slice(0, 16)}
                      </small>
                    ) : (
                      <button
                        className="button primary"
                        onClick={() =>
                          mutate((current, time) =>
                            acknowledge(current, notice.id, responder, time),
                          )
                        }
                      >
                        <Icon name="check" size={18} />
                        対応します
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <Empty>未対応の来訪通知はありません。</Empty>
          )}
        </div>
      </section>
    </>
  );
}
