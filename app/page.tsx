import { Suspense } from "react";
import { ChatPageClient } from "@/components/chat-page-client";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <ChatPageClient />
      </Suspense>
    </main>
  );
}
