"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { SubModel, VoiceModelConfig, modelConfigs } from '../data/modelConfigs'; // Import from the new file
import { XMarkIcon } from '@heroicons/react/24/outline'; // Import XMarkIcon
import toast, { Toaster } from 'react-hot-toast'; // Import react-hot-toast
import { SortableMessage, MessageItem } from './SortableMessage'; // Import the new component and interface
import { SplitterModal } from './SplitterModal'; // Import the new SplitterModal component
import { ModelGrid } from './ModelGrid'; // Import the new ModelGrid component
import { ControlPanel } from './ControlPanel'; // Import the new ControlPanel component

// Main component logic moved here
export default function HomePageClient() {
  // Find the default sub-model to get name, id, and avatar
  const defaultSubModel = modelConfigs[0]?.subModels[0];
  const defaultModelName = defaultSubModel?.name || '默认模型';
  const defaultModelId = defaultSubModel?.id || 'A1';
  const defaultAvator = defaultSubModel?.avator; // Get default avatar

  // Update initial message state - remove height
  const [messages, setMessages] = useState<MessageItem[]>([{
    id: 1,
    text: "",
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
  const [isSplitLoading, setIsSplitLoading] = useState(false); // New state for loading indicator
  const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState<string | null>(null); // State for the synthesized audio URL
  const [isSynthesizing, setIsSynthesizing] = useState(false); // State for synthesis loading

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
    // Add new message - remove height
    setMessages([...messages, {
      id: newId,
      text: "",
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setMessages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
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

  // Function to handle the text splitting (now async)
  const handleSplitConfirm = async (textToSplit: string) => {
    handleCloseSplitterModal(); // Close modal immediately
    const segments = textToSplit.split(/(“[^”]*”)/).filter(segment => segment && segment.trim() !== '');

    if (segments && segments.length > 0) {
      setIsSplitLoading(true); // Start loading
      setMessages([]); // Clear existing messages

      await new Promise(resolve => setTimeout(resolve, 100)); // Small initial delay before first item

      for (const segment of segments) {
        let text = segment.trim();
        if (text.startsWith('"') && text.endsWith('"')) { // Adjusted quotes for safety
          text = text.slice(1, -1);
        }
        const newId = nextId.current;
        nextId.current += 1;
        const newMessage: MessageItem = {
          id: newId,
          text: text,
          modelName: defaultModelName, // Default model
          avator: defaultAvator, // Default avatar
        };

        // Append the new message using callback form
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setFocusedMessageId(newId); // Focus the newly added message

        // Wait for 0.2 seconds before adding the next one
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setIsSplitLoading(false); // Stop loading
    } else {
      console.warn("No content found to split.");
      const newId = nextId.current;
      nextId.current += 1;
      setMessages([{
         id: newId,
         text: "",
         modelName: defaultModelName,
         avator: defaultAvator
      }]);
      setFocusedMessageId(newId);
      setIsSplitLoading(false); // Ensure loading is stopped
    }
  };

  // Function to handle synthesis
  const handleSynthesize = async () => {
    // 1. Check for API Key (Assuming this check is still needed, otherwise remove)
    const apiKey = localStorage.getItem('userKey');
    if (!apiKey) {
      toast.error('请先设置 API KEY');
      handleAvatarClick({ stopPropagation: () => {} } as React.MouseEvent); // Open modal
      return;
    }

    // 2. Check if there's text to synthesize
    const totalLength = messages.reduce((count, msg) => count + msg.text.length, 0);
    if (totalLength === 0) {
      toast.error('请输入需要合成的文本');
      return;
    }

    // 3. Check character limit
    if (totalLength > 5000) {
      toast.error('单次合成字数不能超过 5000 字');
      return;
    }

    // 4. Check if a sub-model is selected
    if (!selectedSubModelId) {
      toast.error('请先选择一个发音人');
      return;
    }

    // 5. Start synthesis process
    setIsSynthesizing(true);
    setSynthesizedAudioUrl(null); // Clear previous result

    // Prepare the request body
    const requestBody = {
      chats: messages.map(msg => {
        // Find the ID corresponding to the message's modelName
        let personId = selectedSubModelId; // Use the globally selected as a fallback
        for (const config of modelConfigs) {
          const subModel = config.subModels.find(sm => sm.name === msg.modelName);
          if (subModel) {
            personId = subModel.id; // Found the specific ID for this message
            break;
          }
        }

        // Log a warning if the specific model wasn't found and we're using the fallback
        // This might happen if modelConfigs changes or there's an inconsistency.
        if (personId === selectedSubModelId && msg.modelName !== modelConfigs.flatMap(c => c.subModels).find(sm => sm.id === selectedSubModelId)?.name) {
            console.warn(`Could not find model ID for name "${msg.modelName}" in message ID ${msg.id}. Using fallback ID: ${selectedSubModelId}`);
        }

        return {
          text: msg.text,
          person: personId, // Use the found (or fallback) ID
          speed: String(speechRate),
          pitch: String(pitch),
          volume: String(volume)
        };
      }),
      audio_sample: 24000,
      // user_id: 'some_user_id' // Add user_id if needed
    };

    try {
      // Use environment variable for Base API URL with fallback
      const baseUrl = process.env.API_BASE_URL;
      const apiUrl = `${baseUrl}/synthesize`; // Construct the full URL

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle HTTP errors
        // Try to parse potential JSON error response first
        let errorMsg = response.statusText;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
            // If response is not JSON, use the status text
        }
        console.error('Synthesis API Error:', response.status, errorMsg);
        toast.error(`合成失败: ${response.status} ${errorMsg}`);
        setIsSynthesizing(false);
        return;
      }

      // Check content type to ensure it's audio
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('audio/')) {
          console.error('Synthesis API did not return audio. Content-Type:', contentType);
          toast.error('合成响应无效，未收到预期的音频文件');
          setIsSynthesizing(false);
          return;
      }

      // Get the response body as a Blob
      const audioBlob = await response.blob();

      // Create an object URL from the Blob
      const audioUrl = URL.createObjectURL(audioBlob);

      setSynthesizedAudioUrl(audioUrl);
      toast.success('合成成功！');

    } catch (error) {
      console.error('Error during synthesis request:', error);
      toast.error('合成请求失败，请检查网络或联系管理员');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="grid grid-rows-[auto_auto_auto_1fr_auto] justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Toaster position="top-center" reverseOrder={false} />
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="w-full px-6 sm:px-8 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="I Speaker Logo" 
              width={40} 
              height={40} 
              className="transform scale-130"
            />
            <h1 className="text-lg font-semibold text-gray-900">I Speaker</h1>
          </div>
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
                    onMessageFocus={handleMessageFocus}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Loading indicator */}
          {isSplitLoading && (
            <div className="flex justify-center items-center p-4 mt-4">
               {/* Simple text loading indicator */}
               <p className="text-sm text-gray-500 animate-pulse">正在添加...</p>
               {/* You could replace the above with a spinner component if preferred */}
            </div>
          )}

          {/* Add new message button (hide while loading) */}
          {!isSplitLoading && (
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
          )}

        </div>

        <ControlPanel
          modelConfigs={modelConfigs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeConfig={activeConfig}
          selectedSubModelId={selectedSubModelId}
          handleSubModelSelect={handleSubModelSelect}
          playSampleAudio={playSampleAudio}
          pauseSampleAudio={pauseSampleAudio}
          playingSubModelId={playingSubModelId}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          pitch={pitch}
          setPitch={setPitch}
          volume={volume}
          setVolume={setVolume}
          messages={messages}
          handleOpenSplitterModal={handleOpenSplitterModal}
          handleSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
          synthesizedAudioUrl={synthesizedAudioUrl}
        />

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

      <SplitterModal isOpen={showSplitterModal} onClose={handleCloseSplitterModal} onSplitConfirm={handleSplitConfirm} />
    </div>
  );
}

function arrayMove<T>(array: T[], from: number, to: number) {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}
