import Image from "next/image";
import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define the MessageItem interface here
export interface MessageItem {
  id: number;
  text: string;
  modelName: string;
  avator?: string;
}

export function SortableMessage({ message, onDelete, onUpdate, onMessageFocus }: {
  message: MessageItem;
  onDelete: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onMessageFocus: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(message.id, e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex gap-4 w-full items-start">
      <div
        {...listeners}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <Image
          src={message.avator || "/women.svg"}
          alt="User avatar"
          width={40}
          height={40}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <div className="flex-grow flex flex-col gap-2">
        <div className="text-xs text-gray-600">
          <span>{message.modelName}</span>
        </div>
        <div className="relative flex-grow flex items-start gap-2">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              style={{ minHeight: '100px' }}
              className="w-full p-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none text-sm transition-all duration-300 ease-in-out overflow-hidden"
              placeholder="在这里输入文本..."
              value={message.text}
              onChange={handleTextChange}
              onFocus={() => onMessageFocus(message.id)}
              rows={1}
            />
          </div>
          <button
            onClick={() => onDelete(message.id)}
            className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1"
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 