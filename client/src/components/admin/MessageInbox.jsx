import { formatDate } from "../../lib/format.js";

/**
 * The contact form inbox. Messages arrive from the public /contact page; this
 * list is the protected read side of the same collection.
 */
export default function MessageInbox({ messages, onToggleRead, busyId }) {
  if (messages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No messages yet. Send one from the contact page to see it here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li
          key={message._id}
          className={`card p-4 ${message.read ? "bg-slate-50" : "border-indigo-200 bg-white"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {message.name}
                <span className="ml-2 font-normal text-slate-500">{message.email}</span>
              </p>
              <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={message.read ? "chip" : "chip-accent"}>
                {message.read ? "Read" : "New"}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={busyId === message._id}
                onClick={() => onToggleRead(message)}
              >
                {message.read ? "Mark unread" : "Mark read"}
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
            {message.message}
          </p>
        </li>
      ))}
    </ul>
  );
}
