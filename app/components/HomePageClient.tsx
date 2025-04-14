"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MessageItem {
  id: number;
  text: string;
  height: number;
  modelName: string;
}

// Define SubModel and VoiceModelConfig interfaces
interface SubModel {
  id: string;
  name: string;
}

interface VoiceModelConfig {
  id: string;
  name: string;
  subModels: SubModel[];
}

// Configuration data for models and sub-models
const modelConfigs: VoiceModelConfig[] = [
  {
    id: 'modelA', name: 'AI大模型超拟人',
    subModels: [{ id: '1', name: '涵竹-开朗女声' }],
  },
  {
    id: 'modelB', name: '有声书',
    subModels: Array.from({ length: 5 }, (_, i) => ({ id: `B${i + 1}`, name: `有声书 ${i + 1}` })),
  },
  {
    id: 'modelC', name: '资讯',
    subModels: Array.from({ length: 2 }, (_, i) => ({ id: `C${i + 1}`, name: `资讯 ${i + 1}` })),
  },
  {
    id: 'modelD', name: '配音',
    subModels: Array.from({ length: 6 }, (_, i) => ({ id: `D${i + 1}`, name: `配音 ${i + 1}` })),
  },
  {
    id: 'modelE', name: '对话助手',
    subModels: Array.from({ length: 3 }, (_, i) => ({ id: `E${i + 1}`, name: `助手 ${i + 1}` })),
  },
];

function SortableMessage({ message, onDelete, onUpdate, onResize, onMessageFocus }: {
  message: MessageItem;
  onDelete: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onResize: (id: number, height: number) => void;
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
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, startHeight + deltaY); // 最小高度为100px
      onResize(message.id, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startY, startHeight, message.id, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(textareaRef.current?.offsetHeight || 0);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex gap-4 w-full items-start">
      <div
        {...listeners}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <Image
          src="/women.svg"
          alt="User avatar"
          width={40}
          height={40}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <div className="flex-grow flex flex-col gap-2">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span>{message.modelName}</span>
        </div>
        <div className="relative flex-grow flex items-start gap-2">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              style={{ height: `${message.height}px` }}
              className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 resize-none text-sm transition-all duration-300 ease-in-out"
              placeholder="在这里输入文本..."
              value={message.text}
              onChange={(e) => onUpdate(message.id, e.target.value)}
              onFocus={() => onMessageFocus(message.id)}
            />
            <div
              ref={resizeHandleRef}
              onMouseDown={handleResizeStart}
              className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize flex items-center justify-center group"
            >
              <div className="w-16 h-1 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500 transition-colors duration-200" />
            </div>
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

// Main component logic moved here
export default function HomePageClient() {
  // Get default model name and ID from the config
  const defaultModelName = modelConfigs[0]?.subModels[0]?.name || '默认模型';
  const defaultModelId = modelConfigs[0]?.subModels[0]?.id || 'A1';

  // Update initial message state to use default from config
  const [messages, setMessages] = useState<MessageItem[]>([{ id: 1, text: "", height: 128, modelName: defaultModelName }]);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const nextId = useRef(2);
  const [activeTab, setActiveTab] = useState(modelConfigs[0]?.id || 'modelA'); // Default active tab from config
  const [selectedSubModelId, setSelectedSubModelId] = useState<string | null>(defaultModelId); // Default selected ID from config
  const [focusedMessageId, setFocusedMessageId] = useState<number>(1);
  const [theme, setTheme] = useState('light');

  // Find the config for the currently active tab
  const activeConfig = modelConfigs.find(config => config.id === activeTab);

  // Effect for localStorage key and setting isClient flag
  useEffect(() => {
    const savedKey = localStorage.getItem('userKey');
    if (savedKey) {
      setInputValue(savedKey);
      setIsKeySaved(true);
    }
    setIsClient(true); // Set client flag only after mount
  }, []);

  // Effect to initialize theme (runs only on client)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Effect to update class and localStorage when theme changes (runs only on client)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Reset sub-model selection when tab changes (select the first sub-model of the new tab)
  useEffect(() => {
    const newActiveConfig = modelConfigs.find(config => config.id === activeTab);
    if (newActiveConfig && newActiveConfig.subModels.length > 0) {
       handleSubModelSelect(newActiveConfig.subModels[0].id, newActiveConfig.subModels[0].name);
    } else {
      setSelectedSubModelId(null); // Or handle case with no submodels if needed
    }
  }, [activeTab]); // Dependency array only includes activeTab

  // Effect for modal outside click (runs only on client)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const avatarElement = document.querySelector('.avatar-container');
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        avatarElement &&
        !avatarElement.contains(event.target as Node)
      ) {
        setShowModal(false);
        const savedKey = localStorage.getItem('userKey');
        if (savedKey) {
          setInputValue(savedKey);
        }
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addNewMessage = () => {
    const newId = nextId.current;
    // Add new message with default model name from config
    setMessages([...messages, { id: newId, text: "", height: 128, modelName: defaultModelName }]);
    nextId.current += 1;
    setFocusedMessageId(newId);
  };

  const updateMessage = (id: number, text: string) => {
    setMessages(messages.map(msg =>
      msg.id === id ? { ...msg, text } : msg
    ));
  };

  const deleteMessage = (id: number) => {
     // Use callback form of setState to ensure we have the latest messages state
    setMessages(currentMessages => {
        const newMessages = currentMessages.filter(msg => msg.id !== id);
        if (focusedMessageId === id) {
            // Find the index of the deleted message *before* filtering
            const deletedIndex = currentMessages.findIndex(m => m.id === id);
            // Determine the new focus ID based on the state *before* deletion
            const newFocusId = newMessages.length > 0
                ? (newMessages[deletedIndex]?.id || newMessages[Math.max(0, deletedIndex - 1)]?.id || newMessages[0]?.id)
                : 1; // Fallback if list becomes empty (though add button implies it won't stay empty)
            setFocusedMessageId(newFocusId);
        }
        return newMessages; // Return the updated list
    });
  };

  const resizeMessage = (id: number, height: number) => {
    setMessages(messages.map(msg =>
      msg.id === id ? { ...msg, height } : msg
    ));
    setFocusedMessageId(id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setMessages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
       // Optionally update focus after drag, e.g., focus the dragged item's new position
       // setFocusedMessageId(active.id);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimeout(() => {
      setShowModal(prev => !prev);
      if (!showModal) {
        const savedKey = localStorage.getItem('userKey');
        if (savedKey) {
          setInputValue(savedKey);
          setIsKeySaved(true);
        }
      }
    }, 0);
  };

  const handleSubModelSelect = (id: string, name: string) => {
    setSelectedSubModelId(id);
    setMessages(currentMessages =>
      currentMessages.map(msg =>
        msg.id === focusedMessageId ? { ...msg, modelName: name } : msg
      )
    );
  };

  const handleMessageFocus = (id: number) => {
    setFocusedMessageId(id);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-black shadow-sm dark:shadow-gray-800 z-10">
        <div className="w-full px-4 sm:px-6 py-2 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">对话列表</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
              aria-label={theme === 'light' ? "切换到暗色模式" : "切换到亮色模式"}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 6.75A5.25 5.25 0 0 0 6.75 12a5.25 5.25 0 0 0 5.25 5.25 5.25 5.25 0 0 0 5.25-5.25A5.25 5.25 0 0 0 12 6.75Z" />
                </svg>
              )}
            </button>
            <div className="relative">
              <div
                className="avatar-container w-8 h-8 rounded-full bg-gradient-to-r from-purple-700 via-pink-700 to-red-700 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
              </div>
              {showModal && (
                <div
                  ref={modalRef}
                  className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg p-4 w-64 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setIsKeySaved(false);
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200 ease-in-out text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="请输入KEY..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        const savedKey = localStorage.getItem('userKey');
                        if (savedKey) {
                          setInputValue(savedKey);
                        }
                      }}
                      className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('userKey', inputValue);
                        setIsKeySaved(true);
                      }}
                      className="px-3 py-1 bg-gray-900 dark:bg-gray-600 text-white dark:text-gray-100 rounded-md hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors text-sm"
                    >
                      {isKeySaved ? "已设置" : "保存"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col sm:flex-row gap-[32px] row-start-2 items-center sm:items-start w-full max-w-screen-2xl mt-16">
        <div className="flex flex-col gap-4 w-full sm:w-3/5">
          {isClient && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={messages.map((msg) => msg.id)}
                strategy={verticalListSortingStrategy}
              >
                {messages.map((message) => (
                  <SortableMessage
                    key={message.id}
                    message={message}
                    onDelete={deleteMessage}
                    onUpdate={updateMessage}
                    onResize={resizeMessage}
                    onMessageFocus={handleMessageFocus}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <button
            onClick={addNewMessage}
            className="self-center mt-4 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors duration-200"
            aria-label="添加新对话"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 w-full sm:w-2/5 bg-white dark:bg-black p-4 rounded-lg border border-gray-300 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {modelConfigs.map((model) => (
              <button
                key={model.id}
                onClick={() => setActiveTab(model.id)}
                className={`py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus:outline-none ${
                  activeTab === model.id
                    ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>

          <div>
            {activeConfig && activeConfig.subModels && renderModelGrid(activeConfig.subModels, selectedSubModelId, handleSubModelSelect)}
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-gray-600 dark:text-gray-400">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

// Helper function to render the grid for a model tab
function renderModelGrid(
  subModels: SubModel[],
  selectedId: string | null,
  onSelect: (id: string, name: string) => void
) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {subModels.map((subModel) => (
        <div
          key={subModel.id}
          onClick={() => onSelect(subModel.id, subModel.name)}
          className={`py-3 px-2 rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            selectedId === subModel.id
              ? 'bg-blue-100 dark:bg-blue-600'
              : 'bg-white dark:bg-black'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
            <Image
              src="/women.svg"
              alt="Sub-model avatar"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority={false}
            />
          </div>
          <p className={`text-sm font-medium ${
              selectedId === subModel.id
                ? 'text-blue-800 dark:text-blue-100'
                : 'text-gray-900 dark:text-gray-100'
              }`}
          >
            {subModel.name}
          </p>
        </div>
      ))}
    </div>
  );
}

// Helper function for array move (used by dnd-kit)
function arrayMove<T>(array: T[], from: number, to: number) {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}
