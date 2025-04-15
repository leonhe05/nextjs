"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { SubModel, VoiceModelConfig, modelConfigs } from '../data/modelConfigs'; // Import from the new file
import { XMarkIcon } from '@heroicons/react/24/outline'; // Import XMarkIcon

interface MessageItem {
  id: number;
  text: string;
  height: number;
  modelName: string;
  avator?: string;
}

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
              style={{ height: `${message.height}px` }}
              className="w-full p-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none text-sm transition-all duration-300 ease-in-out"
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
              <div className="w-16 h-1 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors duration-200" />
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
  // Find the default sub-model to get name, id, and avatar
  const defaultSubModel = modelConfigs[0]?.subModels[0];
  const defaultModelName = defaultSubModel?.name || '默认模型';
  const defaultModelId = defaultSubModel?.id || 'A1';
  const defaultAvator = defaultSubModel?.avator; // Get default avatar

  // Update initial message state height from 128 to 80 and include avatar
  const [messages, setMessages] = useState<MessageItem[]>([{
    id: 1,
    text: "",
    height: 80,
    modelName: defaultModelName,
    avator: defaultAvator // Add default avatar
  }]);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const nextId = useRef(2);
  const [activeTab, setActiveTab] = useState(modelConfigs[0]?.id || 'modelA'); // Default active tab from config
  const [selectedSubModelId, setSelectedSubModelId] = useState<string | null>(defaultModelId); // Default selected ID from config
  const [focusedMessageId, setFocusedMessageId] = useState<number>(1);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [playingSubModelId, setPlayingSubModelId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(5); // Default rate 5
  const [pitch, setPitch] = useState(5); // Default pitch 5
  const [volume, setVolume] = useState(5); // Default volume 5
  const [showSplitterModal, setShowSplitterModal] = useState(false); // State for the new modal

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
    // Ensure light theme class is set on mount (though it's now the default)
    document.documentElement.classList.remove('dark');
  }, []);

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
    // Add new message with updated default height 80 and default avatar
    setMessages([...messages, {
      id: newId,
      text: "",
      height: 80,
      modelName: defaultModelName,
      avator: defaultAvator // Use default avatar
    }]);
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
        // Ensure arrayMove is imported or defined
        // Assuming arrayMove is defined elsewhere as it was before
        // If not, you'll need to add the arrayMove function back
        // function arrayMove<T>(array: T[], from: number, to: number): T[] { ... }
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
    // Find the selected sub-model in the configs to get its avatar
    let selectedAvator: string | undefined;
    for (const config of modelConfigs) {
        const subModel = config.subModels.find(sm => sm.id === id);
        if (subModel) {
            selectedAvator = subModel.avator;
            break;
        }
    }

    setMessages(currentMessages =>
      currentMessages.map(msg =>
        msg.id === focusedMessageId
          ? { ...msg, modelName: name, avator: selectedAvator } // Update name and avatar
          : msg
      )
    );
  };

  const handleMessageFocus = (id: number) => {
    setFocusedMessageId(id);
  };

  // Function to pause sample audio
  const pauseSampleAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause();
    }
    setPlayingSubModelId(null);
  };

  // Function to play sample audio
  const playSampleAudio = (audioSrc: string, subModelId: string) => {
    // Pause current audio if any
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }

    const newPlayer = new Audio(audioSrc);
    setAudioPlayer(newPlayer);
    setPlayingSubModelId(subModelId); // Set playing ID

    newPlayer.play().catch(error => {
      console.error("Error playing audio:", error);
      setPlayingSubModelId(null); // Reset on error
    });

    newPlayer.onended = () => {
      setPlayingSubModelId(null); // Reset on end
    };

    newPlayer.onerror = () => {
      console.error("Audio playback error occurred");
      setPlayingSubModelId(null); // Reset on error
    };
  };

  // Function to open the splitter modal
  const handleOpenSplitterModal = () => {
    setShowSplitterModal(true);
  };

  // Function to close the splitter modal
  const handleCloseSplitterModal = () => {
    setShowSplitterModal(false);
  };

  return (
    <div className="grid grid-rows-[auto_auto_auto_1fr_auto] justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="w-full px-6 sm:px-8 py-2 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">I Speaker</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="avatar-container w-8 h-8 rounded-full bg-gradient-to-r from-purple-700 via-pink-700 to-red-700 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
              </div>
              {showModal && (
                <div
                  ref={modalRef}
                  className="absolute right-0 top-12 bg-white rounded-lg p-4 w-64 shadow-lg border border-gray-200 animate-fade-in"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setIsKeySaved(false);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 ease-in-out text-sm bg-white text-gray-900"
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
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('userKey', inputValue);
                        setIsKeySaved(true);
                      }}
                      className="px-3 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
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

      <div className="row-start-1 flex items-center gap-8 pt-48 pb-48 px-8 w-full max-w-screen-lg mx-auto">
        <h1 className="flex-1 text-5xl sm:text-5xl font-bold text-right bg-gradient-to-r from-purple-800 via-pink-800 to-blue-800 bg-clip-text text-transparent">
          AI大模型语音合成
        </h1>
        <div className="h-16 w-px bg-gray-300"></div>
        <p className="flex-1 text-base sm:text-s text-gray-600 text-left">
          基于大模型全新升级的语音合成，不仅让音色拥有更高的自然度，还能够依据上下文，智能预测文本的情绪、语调等信息，进而自动匹配与之相应的情感表达。
        </p>
      </div>

      <div className="row-start-2 text-center">
          <h2 className="text-xl font-medium">
              <b>快速开始</b>
          </h2>
      </div>

      <main className="row-start-3 flex flex-col sm:flex-row gap-[32px] items-start w-full max-w-screen-2xl">
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

          <div className="flex gap-4 w-full mt-4">
            <div className="w-10 flex-shrink-0"></div>
            <div className="flex-grow flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="flex-grow flex justify-center">
                  <button
                    onClick={addNewMessage}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center"
                    aria-label="Add new message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="w-4 flex-shrink-0"></div>
              </div>
            </div>
          </div>

        </div>
        <div className="sticky top-20 flex flex-col gap-4 w-full sm:w-2/5 bg-white p-4 rounded-lg border border-gray-300 max-h-[calc(100vh-5rem)]">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {modelConfigs.map((model) => (
              <button
                key={model.id}
                onClick={() => setActiveTab(model.id)}
                className={`py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus:outline-none ${
                  activeTab === model.id
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto h-60">
            {activeConfig && activeConfig.subModels && renderModelGrid(
              activeConfig.subModels,
              selectedSubModelId,
              handleSubModelSelect,
              playSampleAudio,
              pauseSampleAudio,
              playingSubModelId
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="speechRate" className="flex-shrink-0 text-sm font-medium text-gray-700">
                语速
              </label>
              <input
                type="range"
                id="speechRate"
                name="speechRate"
                min="0"
                max="15"
                step="1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseInt(e.target.value, 10))}
                className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
              />
              <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
                {speechRate}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pitch" className="flex-shrink-0 text-sm font-medium text-gray-700">
                音调
              </label>
              <input
                type="range"
                id="pitch"
                name="pitch"
                min="0"
                max="15"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
              />
              <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
                {pitch}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label htmlFor="volume" className="flex-shrink-0 text-sm font-medium text-gray-700">
                音量
              </label>
              <input
                type="range"
                id="volume"
                name="volume"
                min="0"
                max="15"
                step="1"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
              />
              <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
                {volume}
              </span>
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={handleOpenSplitterModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              AI多角色自动拆分
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors duration-200">
              合成
            </button>
          </div>

        </div>
      </main>

      <div className="row-start-4 w-full max-w-screen-2xl mx-auto text-left space-y-6 px-8 mt-16">
          <div className="text-center mb-6">
              <h2 className="text-xl font-medium">
                  <b>使用说明</b>
              </h2>
          </div>
          <div className="space-y-4">
              <div>
                  <p className="font-semibold text-gray-800">1. 本网站提供的服务收费吗？</p>
                  <p className="text-gray-600 mt-1">答：本站提供的AI配音功能收费，但可提供免费试用额度，添加微信：text_to_speech 获取免费试用API KEY，获取后点击页面右上角头像按钮，将API KEY设置进去即可试用。</p>
              </div>
              <div>
                  <p className="font-semibold text-gray-800">2. 本站的配音功能如何收费？</p>
                  <p className="text-gray-600 mt-1">答：目前算力成本较高，收费标准暂定为 0.2元/千字，需要使用的请添加微信：text_to_speech 购买API KEY。</p>
              </div>
              <div>
                  <p className="font-semibold text-gray-800">3. 还有那些使用说明？</p>
                  <p className="text-gray-600 mt-1">答：点击播音员头像即可试听该播音员音色；本站提供AI自动多角色拆分功能，点击AI多角色自动拆分按钮，在弹窗中输入一段文本，AI可自动分析文本中各个角色的对话，并自动按角色拆分，填入左侧对话框中；可点击左侧对话框下方的"+"号来添加对话，可为每个对话设置不同的播音员，点击对话框右侧的"-"号按钮，可删除该段对话。</p>
              </div>
          </div>
      </div>

      <footer className="row-start-5 flex text-sm gap-[24px] flex-wrap items-center justify-center text-gray-600">
          联系微信：text_to_speech
      </footer>

      {showSplitterModal && (
        <SplitterModal isOpen={showSplitterModal} onClose={handleCloseSplitterModal} />
      )}
    </div>
  );
}

function renderModelGrid(
  subModels: SubModel[],
  selectedId: string | null,
  onSelect: (id: string, name: string) => void,
  onPlayAudio: (src: string, id: string) => void,
  onPauseAudio: () => void,
  playingId: string | null
) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-3">
      {subModels.map((subModel) => {
        const isPlaying = playingId === subModel.id;
        const isHovered = hoveredId === subModel.id;

        return (
          <div
            key={subModel.id}
            onClick={() => onSelect(subModel.id, subModel.name)}
            className={`relative py-2 px-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedId === subModel.id
                ? 'bg-gray-100'
                : 'bg-white'
            }`}
            onMouseEnter={() => setHoveredId(subModel.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden"
            >
              <Image
                src={subModel.avator || '/models_avators/women1.svg'}
                alt="Sub-model avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority={false}
              />
              {subModel.audioSrc && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) {
                      onPauseAudio();
                    } else {
                      if (subModel.audioSrc) {
                        onPlayAudio(subModel.audioSrc, subModel.id);
                      }
                    }
                  }}
                  className={`absolute inset-0 flex items-center justify-center bg-black rounded-full text-white focus:outline-none transition-opacity duration-200 ease-in-out ${
                    (isHovered || isPlaying) ? 'opacity-75' : 'opacity-0 pointer-events-none'
                  }`}
                  aria-label={isPlaying ? "Pause sample audio" : "Play sample audio"}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">
              {subModel.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function arrayMove<T>(array: T[], from: number, to: number) {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}

function SplitterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [modalText, setModalText] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSplit = () => {
    console.log("Splitting text:", modalText);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div
        ref={modalContentRef}
        className="bg-white rounded-lg w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '80vh', boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI多角色自动拆分</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <textarea
            value={modalText}
            onChange={(e) => setModalText(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 ease-in-out text-sm bg-white text-gray-900 resize-none"
            placeholder="在此处粘贴或输入需要拆分的文本..."
          />
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={handleSplit}
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            AI拆分
          </button>
        </div>
      </div>
    </div>
  );
}
