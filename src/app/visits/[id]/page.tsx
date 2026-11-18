import { VisitDetail } from "@/components/visit-detail";

// 内容はlocalStorageから読み取り、未生成IDは404フォールバックでも復元する。
export function generateStaticParams() {
  return [{ id: "detail" }];
}

export default function Page() {
  return <VisitDetail />;
}
