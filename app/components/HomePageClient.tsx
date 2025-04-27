"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
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

  // User Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [remainWords, setRemainWords] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // --- 新增：刷新状态 ---
  const [isRefreshing, setIsRefreshing] = useState(false); // State for refresh loading

  // Find the config for the currently active tab
  const activeConfig = modelConfigs.find(config => config.id === activeTab);

  // --- 新增：页面加载后请求接口 ---
  useEffect(() => {
    const fetchData = async () => {
      fetch('https://service.ispeaker.cn/online');
    };
    fetchData();
  }, []); // 空依赖数组确保只在挂载时运行一次

  // Effect for setting isClient flag and loading user data from localStorage
  useEffect(() => {
    setIsClient(true); // Set client flag only after mount
    // Attempt to load user data from localStorage
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    const storedUserId = localStorage.getItem('userId');
    const storedToken = localStorage.getItem('token');
    const storedRemainWords = localStorage.getItem('remainWords');

    if (loggedInStatus === 'true' && storedUserId && storedToken && storedRemainWords) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
      setToken(storedToken);
      setRemainWords(storedRemainWords);
      console.log('User data loaded from localStorage.');
    }

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

  // Effect for modal outside click
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
    setShowModal(prev => !prev);
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

  // Function to handle the text splitting (modified for quote-based splitting and delay)
  const handleSplitConfirm = async (textToSplit: string) => {
    setIsSplitLoading(true); // Start loading
    handleCloseSplitterModal(); // Close modal immediately

    // Regex to split by Chinese quotes, keeping delimiters and capturing content inside/outside
    const regex = /(“[^”]*”)|([^“”]+)/g;
    const splitSegments = textToSplit.match(regex)?.map(s => s.trim()).filter(s => s) || [];

    if (splitSegments.length === 0) {
        toast.error("未找到可拆分的对话或旁白。");
        setIsSplitLoading(false);
        return;
    }

    // Find the message that needs to be split
    const messageToSplitIndex = messages.findIndex(msg => msg.id === focusedMessageId);
    if (messageToSplitIndex === -1) {
      console.error("Focused message for splitting not found.");
      toast.error("无法找到要拆分的原始消息。");
      setIsSplitLoading(false);
      return;
    }
    const messageToSplit = messages[messageToSplitIndex];

    // Prepare the array of new messages without IDs yet
    const preparedMessages = splitSegments.map(segment => {
        // Remove quotes if they exist
        const text = segment.startsWith('"') && segment.endsWith('"')
            ? segment.slice(1, -1).trim()
            : segment.trim();
        return {
            text: text,
            modelName: messageToSplit.modelName, // Keep the original model and avatar
            avator: messageToSplit.avator
        };
    }).filter(msg => msg.text); // Filter out empty messages again after trimming quotes

    if (preparedMessages.length === 0) {
        toast.error("拆分后未生成有效对话。");
        setIsSplitLoading(false);
        // Optionally remove the original message if it was just quotes/whitespace
        // setMessages(prev => prev.filter(m => m.id !== focusedMessageId));
        return;
    }

    // Get the current state *before* starting the delayed additions
    const originalMessages = [...messages];

    // Function to add messages one by one with delay
    const addMessagesWithDelay = (index: number, currentMessagesState: MessageItem[], currentNextId: number) => {
      if (index >= preparedMessages.length) {
          setIsSplitLoading(false); // Stop loading after all messages are added
          // Focus the first newly added message ID
          if (preparedMessages.length > 0) {
              const firstNewMessageId = currentNextId - preparedMessages.length; // Calculate the ID of the first added message
              setFocusedMessageId(firstNewMessageId);
          }
          return;
      }

      const newMsgData = preparedMessages[index];
      const newId = currentNextId;
      const newMessage: MessageItem = {
        ...newMsgData,
        id: newId,
      };

      // Calculate insert position based on the *original* index
      const insertIndex = messageToSplitIndex + index;

      // Update state - important to use the functional update form of setMessages
      setMessages(prevMessages => {
          // Find the current insert index in the potentially updated prevMessages
          const currentInsertIndex = prevMessages.findIndex(m => m.id === messageToSplit.id) + 1 + index; // +1 because we insert *after* the original (or its replacement)

          // Create the new array with the inserted message
          const updatedMessages = [
              ...prevMessages.slice(0, currentInsertIndex),
              newMessage,
              ...prevMessages.slice(currentInsertIndex)
          ];
          return updatedMessages;
      });


      // Schedule the next addition
      setTimeout(() => {
        addMessagesWithDelay(index + 1, currentMessagesState, currentNextId + 1); // Pass updated nextId
      }, 300); // 300ms delay
    };

    // Start the process: Remove the original message first, then add new ones delayed
    setMessages(prev => prev.filter(m => m.id !== focusedMessageId));
    // Ensure the nextId state is updated correctly *before* starting the loop
    const initialNextId = nextId.current;
    nextId.current = initialNextId + preparedMessages.length; // Reserve IDs
    addMessagesWithDelay(0, originalMessages, initialNextId); // Start adding with the initial nextId
  };

  // Function to handle synthesis
  const handleSynthesize = async () => {
    // 1. Check if there's text to synthesize
    const totalLength = messages.reduce((count, msg) => count + msg.text.length, 0);
    if (totalLength === 0) {
      toast.error('请输入需要合成的文本');
      return;
    }

    // 2. Check character limit
    if (totalLength > 3000) {
      toast.error('单次合成字数不能超过 3000 字');
      return;
    }

    // 3. Check if a sub-model is selected
    if (!selectedSubModelId) {
      toast.error('请先选择一个发音人');
      return;
    }

    // 4. Start synthesis process
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
    };

    if (!isLoggedIn || !token) {
      toast.error('右上角扫码登录后再进行语音合成');
      setShowModal(true);
      setIsSynthesizing(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const apiUrl = `${baseUrl}/synthesize`; 

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(requestBody),
      });

      // 检查返回类型
      const contentType = response.headers.get('content-type');
      if (!contentType) {
        toast.error('合成响应无效，未收到预期的数据');
        setIsSynthesizing(false);
        return;
      }

      if (contentType.startsWith('audio/')) {
        // 处理音频
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setSynthesizedAudioUrl(audioUrl);
        toast.success('合成成功！');
      } else if (contentType.startsWith('application/json')) {
        // 处理 JSON 响应（无论状态码是否为 200）
        const result = await response.json();
        toast.error(`合成失败: ${result.ret_msg || '未知错误'}`);
      } else {
        toast.error('合成响应无效，未收到预期的数据');
      }
    } catch (error) {
      toast.error('合成请求失败，请检查网络或联系管理员');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // --- 新增：处理刷新用户信息 ---
  const handleRefresh = async () => {
    if (!token) {
      toast.error("请先登录");
      return;
    }

    setIsRefreshing(true); // 开始刷新状态
    const toastId = toast.loading('正在刷新...');

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error("API基础URL未配置 (NEXT_PUBLIC_API_BASE_URL)");
      }
      const refreshUrl = `${apiBaseUrl}/refresh`; // 假设刷新接口是 /refresh

      const response = await fetch(refreshUrl, {
        method: 'POST', // 或者根据您的 API 设计使用 GET
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // 将 token 放入 Authorization header
        },
        // 如果需要，可以在 body 中发送数据
        // body: JSON.stringify({ /* 可选参数 */ }),
      });

      if (!response.ok) {
        let errorMsg = `刷新失败: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.ret_msg || errorData.message || errorMsg;
        } catch (e) {
          console.error("无法解析刷新错误响应:", e);
          const textError = await response.text().catch(() => "无法读取响应文本");
          errorMsg += `. 响应: ${textError.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.ret_code === "00" && data.token && data.remain_words !== undefined) {
        // 更新状态
        setToken(data.token);
        setRemainWords(String(data.remain_words));

        // 更新 localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('remainWords', String(data.remain_words));

        toast.success('用户信息已刷新');
      } else {
        const errorMsg = data.ret_msg || `刷新响应无效，代码: ${data.ret_code || '未知'}`;
        console.error("刷新响应错误:", data);
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('刷新 API 错误:', error);
      toast.error(error.message || '刷新过程中发生未知错误');
    } finally {
      setIsRefreshing(false); // 结束刷新状态
      toast.dismiss(toastId); // 关闭加载提示
    }
  };

  // Handle Logout
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('remainWords');
    localStorage.removeItem('isLoggedIn');

    // Reset state
    setIsLoggedIn(false);
    setUserId(null);
    setToken(null);
    setRemainWords(null);

    // Close modal
    setShowModal(false);
    toast.success('已登出');
  };

  return (
    <div className="grid grid-rows-[auto_auto_auto_1fr_auto] justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Toaster position="top-center" reverseOrder={false} />
      <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-sm shadow-xs z-10">
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
                onClick={handleAvatarClick} // Attach the handler here
              >
                {isLoggedIn && userId && <span className="text-white text-xs font-bold">{userId.charAt(0).toUpperCase()}</span>}
              </div>
              {showModal && (
                <div
                  ref={modalRef} // Attach ref here
                  className="absolute right-0 top-12 bg-white rounded-lg p-6 w-64 shadow-lg border border-gray-200 animate-fade-in"
                  onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
                >
                  {isLoggedIn ? (
                    // Logged In View
                    <div className="text-sm">
                      {/* User Info Grid */}
                      <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1 mb-2">
                        {/* Row 1: User ID & Refresh Button */}
                        <span className="text-gray-500 justify-self-start self-center">用户ID:</span>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800 dark:text-gray-700">{userId}</span>
                          <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="text-xs text-blue-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRefreshing ? '刷新中...' : '刷新'}
                          </button>
                        </div>
                        
                        {/* Row 2: Remaining Words & Purchase Link */}
                        <span className="text-gray-500 justify-self-start">剩余字数:</span>
                        <div className="flex justify-between items-center"> 
                            <span className="text-gray-800 dark:text-gray-700">{remainWords}</span>
                            <a href="/purchase" className="text-blue-500 hover:underline text-xs ml-2">
                              购买
                            </a>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        登出
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const appId = process.env.NEXT_PUBLIC_ALIPAY_APP_ID;
                        const redirectUri = process.env.NEXT_PUBLIC_ALIPAY_REDIRECT_URI;
                        if (!appId) {
                           toast.error('Alipay App ID is not configured.');
                           return;
                        }
                        if (!redirectUri) {
                          toast.error('Alipay Redirect URI is not configured.');
                          return;
                        }
                        const encodedRedirectUri = encodeURIComponent(redirectUri);
                        const scope = 'auth_base';
                        const state = Math.random().toString(36).substring(2);
                        sessionStorage.setItem('alipay_oauth_state', state);
                        const authUrl = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${appId}&scope=${scope}&redirect_uri=${encodedRedirectUri}&state=${state}`;
                        window.location.href = authUrl;
                      }}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      支付宝快捷登录
                    </button>
                  )}
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
          <a href="https://free.ispeaker.cn" className="text-blue-800 underline  ml-2">
            使用历史免费版
          </a>
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
                  <p className="text-gray-600 mt-1">答：本站提供的AI配音功能收费，但右上角登录后提供免费试用额度</p>
              </div>
              <div>
                  <p className="font-semibold text-gray-800">2. 本站的配音功能如何收费？</p>
                  <p className="text-gray-600 mt-1">答：目前算力成本较高，收费标准可点击右上角 头像-购买 查看</p>
              </div>
              <div>
                  <p className="font-semibold text-gray-800">3. 还有那些使用说明？</p>
                  <p className="text-gray-600 mt-1">答：点击播音员头像即可试听该播音员音色；本站提供AI自动多角色拆分功能，点击AI多角色自动拆分按钮，在弹窗中输入一段文本，AI可自动分析文本中各个角色的对话，并自动按角色拆分，填入左侧对话框中；可点击左侧对话框下方的 "+" 号来添加对话，可为每个对话设置不同的播音员，点击对话框右侧的 "-" 号按钮，可删除该段对话。联系微信：text_to_speech
                  </p>
              </div>
          </div>
      </div>

      <footer className="text-center p-4 mt-8 text-gray-500 text-sm">
          <p>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              粤ICP备2025407777号-1
            </a>
          </p>
        </footer>

      <SplitterModal isOpen={showSplitterModal} onClose={handleCloseSplitterModal} onSplitConfirm={handleSplitConfirm} />
    </div>
  );
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}
