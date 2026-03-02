import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MicOff, Mic } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";
export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;

  return (
    <main className="book-page-container">
      {/* Floating Back Button */}
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="size-5 text-[#212a3b]" />
      </Link>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <section className="vapi-header-card">
          {/* Book Cover with Mic Button */}
          <div className="vapi-cover-wrapper">
            <Image
              src={book.coverURL}
              alt={book.title}
              width={120}
              height={180}
              className="w-30 h-auto rounded-lg object-cover shadow-lg"
            />
            {/* Mic Button */}
            <div className="vapi-mic-wrapper">
              <button
                className="vapi-mic-btn"
                type="button"
                aria-label="Start conversation"
              >
                <MicOff className="size-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Book Info */}
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#212a3b]">
              {book.title}
            </h1>
            <p className="text-[#3d485e] text-base">by {book.author}</p>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Status Indicator */}
              <div className="vapi-status-indicator">
                <span className="vapi-status-dot vapi-status-dot-ready"></span>
                <span className="vapi-status-text">Ready</span>
              </div>

              {/* Voice Badge */}
              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  Voice: {book.persona || "Default"}
                </span>
              </div>

              {/* Timer Badge */}
              <div className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
              </div>
            </div>
          </div>
        </section>

        {/* Transcript Area */}
        <section className="transcript-container min-h-100">
          <div className="transcript-empty">
            <Mic className="size-12 text-[#3d485e] mb-4" />
            <p className="transcript-empty-text">No conversation yet</p>
            <p className="transcript-empty-hint">
              Click the mic button above to start talking
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}