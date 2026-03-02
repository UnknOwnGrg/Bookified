"use client";

import Image from "next/image";
import { MicOff, Mic } from "lucide-react";
import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import Transcript from "./Transcript";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    limitError,
    start,
    stop,
    clearErrors,
  } = useVapi(book);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Error Display */}
        {limitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p>{limitError}</p>
          </div>
        )}

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
              <button onClick={isActive ? stop : start } disabled={ status === 'connecting'}
                className="vapi-mic-btn"
                type="button"
                aria-label="Start conversation"
              >
                { isActive ? (
                  <Mic className="size-6 text-white" />
                ) :(
                  <MicOff className="size-6 text-gray-500" />
                )} 
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
                <span className={`vapi-status-dot ${isActive ? 'vapi-status-dot-active' : 'vapi-status-dot-ready'}`}></span>
                <span className="vapi-status-text">{status}</span>
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
        <section className="vapi-transcript-wrapper">
          <Transcript
            messages={messages}
            currentMessage={currentMessage}
            currentUserMessage={currentUserMessage}
          />
        </section>
      </div>
    </>
  );
};

export default VapiControls;
