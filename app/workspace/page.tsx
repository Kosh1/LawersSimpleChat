import { Suspense } from "react";
import { ChatPageClient } from "@/components/chat-page-client";
import '@/components/retro-workspace.css';

export default function WorkspacePage() {
  return (
    <main className="retro-workspace min-h-screen">
      <Suspense fallback={null}>
        <ChatPageClient />
      </Suspense>
    </main>
  );
}






