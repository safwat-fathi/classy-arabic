"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { sendMessage, type IngestState } from "./actions";
import * as m from "@/paraglide/messages";

const initialState: IngestState = { status: "idle" };

export function MessageComposer({
  conversationId,
  onStateChange,
}: {
  conversationId: string;
  onStateChange: (state: IngestState) => void;
}) {
  const placeholders = [
    m.demo_msg_ph_1(),
    m.demo_msg_ph_2(),
    m.demo_msg_ph_3(),
    m.demo_msg_ph_4(),
  ];

  const action = sendMessage.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<
    { id: string; text: string; role: "user" | "ai" }[]
  >([]);

  const [placeholderText, setPlaceholderText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isFocused) {
      setPlaceholderText(m.demo_msg_placeholder());
      return;
    }

    const currentPhrase = placeholders[phraseIndex];
    let timeoutId: NodeJS.Timeout;

    if (!isDeleting && placeholderText === currentPhrase) {
      timeoutId = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && placeholderText === "") {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % placeholders.length);
    } else {
      timeoutId = setTimeout(
        () => {
          setPlaceholderText(
            isDeleting
              ? currentPhrase.substring(0, placeholderText.length - 1)
              : currentPhrase.substring(0, placeholderText.length + 1),
          );
        },
        isDeleting ? 30 : 70,
      );
    }

    return () => clearTimeout(timeoutId);
  }, [placeholderText, isDeleting, phraseIndex, isFocused]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;
    if (!text || !text.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, role: "user" },
    ]);

    if (formRef.current) {
      formRef.current.reset();
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-[#efeae2] shadow-sm">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
          {m.demo_msg_avatar()}
        </div>
        <div>
          <h2 className="font-semibold">{m.demo_msg_customer()}</h2>
          <p className="text-xs text-white/80">{m.demo_msg_online()}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
        style={{ minHeight: "300px" }}
      >
        <div className="mx-auto mb-4 w-fit rounded-lg bg-[#e1f5fe] px-3 py-1 text-xs text-gray-600 shadow-sm">
          {m.demo_msg_today()}
        </div>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${msg.role === "user" ? "self-end bg-[#dcf8c6] text-gray-900" : "self-start bg-white text-gray-900"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex items-end gap-2 bg-[#f0f0f0] p-3"
      >
        <textarea
          name="text"
          required
          rows={1}
          placeholder={
            isFocused ? m.demo_msg_placeholder() : placeholderText || " "
          }
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (!e.target.value) setIsFocused(false);
          }}
          className="max-h-32 min-h-12 flex-1 resize-none rounded-full border-none bg-white px-4 py-3 text-sm focus:outline-none focus:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white transition-colors hover:bg-[#008f6f] disabled:opacity-50"
        >
          {isPending ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              className="h-5 w-5 rotate-90 rtl:-rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </section>
  );
}
