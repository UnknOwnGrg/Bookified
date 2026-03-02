"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { Messages } from "@/types";

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty =
    messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="transcript-container">
        <div className="transcript-empty">
          <Mic className="size-12 text-[#3d485e] mb-4" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      <div className="transcript-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`transcript-message ${
              message.role === "user"
                ? "transcript-message-user"
                : "transcript-message-assistant"
            }`}
          >
            <div
              className={`transcript-bubble ${
                message.role === "user"
                  ? "transcript-bubble-user"
                  : "transcript-bubble-assistant"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Streaming user message */}
        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        {/* Streaming assistant message */}
        {currentMessage && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Transcript;
