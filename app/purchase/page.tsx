"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast"; // Import Toaster
import { useRouter } from "next/navigation"; // 引入 useRouter

export default function PurchasePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // Add state for user ID
  const [alipayFormHtml, setAlipayFormHtml] = useState<string | null>(null); // State for Alipay form HTML
  const [isLoading, setIsLoading] = useState(false); // State for loading status
  const iframeRef = useRef<HTMLIFrameElement>(null); // Ref for the iframe
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // 新增：当前轮询的订单 ID
  const router = useRouter(); // 初始化 useRouter

  useEffect(() => {
    setIsClient(true);
    // Get user ID from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Effect to handle polling based on currentOrderId
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (currentOrderId) {
      console.log(`[Polling Effect] currentOrderId is ${currentOrderId}, starting interval.`);
      intervalId = setInterval(() => {
        console.log(`[Polling Interval] Querying status for order ${currentOrderId}`);
        queryOrderStatus(currentOrderId);
      }, 2000); // Check every 2 seconds
    } else {
      console.log("[Polling Effect] currentOrderId is null, polling stopped or not started.");
      // No need to explicitly clear interval here, the cleanup function handles it
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        console.log(`[Polling Effect Cleanup] Clearing interval ${intervalId} for order ${currentOrderId}`);
        clearInterval(intervalId);
      } else {
        console.log("[Polling Effect Cleanup] No interval to clear.");
      }
    };
  }, [currentOrderId]); // Dependency array: re-run effect when currentOrderId changes

  // --- 新增：组件卸载时清除轮询 ---
  useEffect(() => {
      return () => {
          // Cleanup logic will now be handled by the polling useEffect
      };
  }, []); // Empty dependency array means this runs only on mount and unmount

  const plans = [
    // Added numeric amount for easier use in API call
    { id: "plan1", name: "2千字", price: "0.5元", unitPrice: "0.25元/千字", amount: 0.5 },
    { id: "plan2", name: "1万字", price: "2元", unitPrice: "0.2元/千字", amount: 2 },
    { id: "plan3", name: "10万字", price: "18元", unitPrice: "0.18元/千字", amount: 18 },
    { id: "plan4", name: "50万字", price: "80元", unitPrice: "0.16元/千字", amount: 18 },
    { id: "plan5", name: "100万字", price: "138元", unitPrice: "0.138元/千字", amount: 138 },
  ];

  // --- 新增：查询订单状态函数 ---
  const queryOrderStatus = async (orderId: string) => {
    console.log(`Querying status for order_id: ${orderId}`);
    try {
      // --- 新增：获取 token ---
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token not found in localStorage during queryOrderStatus.");
        toast.error("用户认证失败，请重新登录");
        // 可以考虑停止轮询，或者根据业务逻辑处理
        setCurrentOrderId(null); // 停止轮询
        return;
      }
      // --- 结束新增 ---

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        // 如果正在轮询，避免重复抛出错误干扰用户
        return;
      }
      const queryUrl = `${apiBaseUrl}/queryOrder`;

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // --- 新增：添加 Authorization 头 ---
          'Authorization': token,
        },
        body: JSON.stringify({
          order_id: orderId,
          user_id: userId // Add user_id here
        }),
      });

      // 网络层错误处理
      if (!response.ok) {
          console.warn(`Query order request failed: ${response.status} ${response.statusText}`);
          try {
              const errorBody = await response.text(); // 尝试读取错误体
              console.warn("Error response body:", errorBody.substring(0, 200)); // 打印前200个字符
          } catch (e) {
              console.warn("Could not read error response body.");
          }
          // 继续轮询，除非是特定的不可恢复错误（例如 404 Not Found 可能表示接口不存在）
          // if (response.status === 404) { ... stop polling ... }
          return;
      }

      // 解析 JSON
      let data;
      try {
           data = await response.json();
      } catch (e) {
           console.error("Failed to parse query response JSON:", e);
           const textBody = await response.text().catch(() => "Could not read response text");
           console.error("Response text:", textBody.substring(0, 200));
           return; // 解析失败，暂时继续轮询
      }


      // 业务逻辑处理
      if (data.ret_code === "00") {
        // 支付成功
        console.log("Payment successful for order:", orderId, "Response data:", data);
        toast.dismiss(); // 清除所有提示，包括之前的扫码提示
        toast.success('支付成功！正在跳转...', { duration: 3000 }); // 显示成功提示，持续3秒

        // 设置 currentOrderId 为 null，将触发 useEffect 清理轮询
        console.log("[queryOrderStatus] Payment successful. Setting currentOrderId to null to stop polling.");
        setCurrentOrderId(null); // This will trigger the useEffect cleanup

        setAlipayFormHtml(null); // 清除支付宝表单，iframe 会显示占位图
        setIsLoading(false); // 支付成功，结束加载状态


        // 更新剩余字数到 localStorage
        if (data.remain_words !== undefined && data.remain_words !== null) {
           console.log(`Updating remainWords in localStorage to: ${data.remain_words}`);
           localStorage.setItem('remainWords', data.remain_words.toString());
        } else {
            console.warn("remain_words not found or is null in successful query response:", data);
            // 可选：即使支付成功，如果没有返回剩余字数，也给用户一个提示
            // toast.error('支付成功，但未能获取最新字数，请稍后刷新查看。');
        }

        // 延迟跳转，给用户看成功提示的时间
        setTimeout(() => {
            router.push('/');
        }, 1500); // 延迟 1.5 秒跳转

      } else {
        // ret_code 不是 "00"，表示订单未支付或处理中，继续轮询
        // 避免过于频繁的日志刷屏
        // console.log(`Order ${orderId} status: ${data.ret_code} (${data.ret_msg || 'No message'}). Continuing poll.`);
      }

      // Add a log here if ret_code != "00" to confirm function completion
      if (typeof data !== 'undefined' && data?.ret_code !== "00") {
          console.log(`[queryOrderStatus] Order ${orderId} status is ${data.ret_code}. Polling should continue.`);
      }

    } catch (error) {
      // 网络请求或其他意外错误
      console.error(`Error querying order status for ${orderId}:`, error);
      // 考虑是否需要停止轮询，例如连续N次失败后
      // toast.error(`查询订单状态时出错: ${error instanceof Error ? error.message : '未知网络错误'}`);
    }
  };

  // --- 新增：开始轮询函数 ---
  const startPolling = (orderId: string) => {
    console.log(`[startPolling] Function called with orderId: ${orderId}`);

    setCurrentOrderId(orderId); // 设置当前订单 ID

    console.log(`[startPolling] Starting polling execution for order_id: ${orderId}`);
    toast.dismiss(); // 清除之前的 "创建订单" loading
    toast.loading('请扫描二维码完成支付。支付成功后将自动跳转...', { duration: 300000 }); // 持续10分钟或直到被清除

    // 立即执行一次查询（稍微延迟以给后端一点时间处理）
    console.log(`[startPolling] Scheduling initial queryOrderStatus for ${orderId}`);
    setTimeout(() => queryOrderStatus(orderId), 500);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("请选择一种套餐");
      return;
    }
    if (!userId) {
        toast.error("无法获取用户信息，请尝试重新登录");
        return;
    }
     // 如果正在轮询或仍在加载上一个订单，阻止发起新的支付
    if (isLoading || currentOrderId) {
        toast.error("正在处理上一个订单，请稍候...");
        return;
    }

    // --- 新增：获取 token ---
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Token not found in localStorage during handlePayment.");
      toast.error("用户认证失败，请重新登录后再尝试购买");
      setIsLoading(false); // 重置加载状态
      return;
    }
    // --- 结束新增 ---

    const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanDetails) {
        toast.error("选择的套餐详情未找到");
        return;
    }

    const amount = selectedPlanDetails.amount;

    setIsLoading(true); // 开始加载状态
    setAlipayFormHtml(null); // 清除旧的 iframe 内容
    const toastId = toast.loading('正在创建订单...');

    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiBaseUrl) {
            throw new Error("API基础URL未配置 (NEXT_PUBLIC_API_BASE_URL)");
        }
        const apiUrl = `${apiBaseUrl}/submitOrder`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            // --- 新增：添加 Authorization 头 ---
            'Authorization': token,
            },
            body: JSON.stringify({
            user_id: userId,
            amount: amount,
            }),
        });

        // 不在这里 dismiss toastId，让 startPolling 接管

        if (!response.ok) {
            let errorMsg = `支付请求失败: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.ret_msg || errorData.message || errorMsg;
            } catch (e) {
                 console.error("Could not parse error response:", e);
                 const textError = await response.text().catch(() => "无法读取响应文本");
                 errorMsg += `. 响应: ${textError.substring(0, 100)}`;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("submitOrder API response status:", response.status, "ret_code:", data.ret_code); // 添加日志

        if (data.ret_code !== "00") {
            const errorMsg = data.ret_msg || `订单创建失败，代码: ${data.ret_code || '未知'}`;
            console.error("Backend error:", data);
            throw new Error(errorMsg);
        }

        // --- 修改点：获取 order_id 并开始轮询 ---
        const htmlForm = data.order_msg;
        const orderId = data.order_id; // 从响应中获取 order_id

        console.log("submitOrder successful. Received order_id:", orderId, "Received htmlForm:", !!htmlForm);

        if (!htmlForm || typeof htmlForm !== 'string') {
            console.error("Invalid order_msg received:", data);
            throw new Error("未能获取有效的支付信息 (order_msg)");
        }
         if (!orderId || typeof orderId !== 'string') {
             console.error("Invalid or missing order_id received:", data);
             throw new Error("未能获取有效的订单ID (order_id)");
         }

        setAlipayFormHtml(htmlForm); // 加载支付宝表单到 iframe, 这会触发 useEffect 更新 isQrCodeVisible

        // setIsLoading(false); // 不在这里设置 false，让轮询控制

        console.log("Calling startPolling with orderId:", orderId);

        // Wait for 3 seconds before starting polling
        console.log("Order submitted successfully. Waiting 3 seconds before starting polling...");
        setTimeout(() => {
            console.log("3-second delay finished. Calling startPolling now.");
            startPolling(orderId); // 使用获取到的 orderId 开始轮询
        }, 3000); // 3000 milliseconds = 3 seconds

    } catch (error) {
        toast.dismiss(toastId); // 创建订单出错，清除 loading
        console.error("Payment initiation failed:", error);
        toast.error(`支付初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        setAlipayFormHtml(null);
        setIsLoading(false); // 只有在创建订单彻底失败时才重置 isLoading
        setCurrentOrderId(null); // Make sure polling stops on error
    }
  };

  return (
    <div className="relative min-h-screen p-8 bg-gray-50 font-[family-name:var(--font-geist-sans)]">
        {/* --- Logo Section --- */}
        <div className="absolute top-8 left-8 z-20">
            <Link href="/" className="flex items-center space-x-2">
                <Image src="/logo.png" alt="I Speaker" width={40} height={40} />
                <span className="text-2xl font-semibold text-gray-800">I Speaker</span>
            </Link>
        </div>
        {/* --- End Logo Section --- */}
        <Toaster position="top-center" reverseOrder={false} />
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xs p-8 mt-20">
            {/* User ID display remains at the top */}
            <div className="flex justify-center items-baseline gap-3 mb-10">
                {isClient && userId && ( <span className="text-xl whitespace-nowrap">为用户 <span className="font-bold">{userId}</span> 购买语音合成字数</span> )}
                {isClient && !userId && ( <span className="text-xl text-red-600">无法获取用户ID，请刷新或重新登录。</span> )}
            </div>

            {/* Main content area with conditional client-side rendering */}
            {isClient && (
                // New Flex container for side-by-side layout on medium screens and up
                <div className="flex flex-col md:flex-row md:gap-8 md:items-start">

                    {/* --- Left Column (Plans & Action) --- */}
                    <div className="w-full md:w-2/3 flex flex-col">
                        {/* Plan Selection Grid - Changed to single column */}
                        <div className="grid grid-cols-1 gap-6 mb-10"> {/* Removed sm:grid-cols-2 */}
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${
                                        selectedPlan === plan.id
                                            ? "border-blue-500 bg-blue-50 shadow-lg"
                                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                                    } ${isLoading || !!currentOrderId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !(isLoading || !!currentOrderId) && setSelectedPlan(plan.id)}
                                >
                                    <div className="flex items-baseline justify-between space-x-4"> {/* Use justify-between for spacing */}
                                        <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">{plan.name}/不限时</h2>
                                        <p className="text-sm text-gray-500 whitespace-nowrap">{plan.unitPrice}</p>
                                        <p className="text-2xl font-bold text-blue-600 whitespace-nowrap">{plan.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Button & Home Link - Placed under plans */}
                        <div className="flex flex-col items-center space-y-4 mt-auto"> {/* mt-auto to push to bottom if needed, or remove */}
                             <button
                                onClick={handlePayment}
                                disabled={!selectedPlan || isLoading || !userId || !!currentOrderId}
                                className={`w-full max-w-xs px-8 py-3 rounded-lg transition-colors text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                selectedPlan && userId && !currentOrderId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                                }`}
                            >
                                {isLoading ? '创建订单中...' : (currentOrderId ? '等待支付结果...' : '支付宝支付')}
                            </button>
                            <Link href="/" className="text-blue-500 hover:underline text-sm">
                                返回首页
                            </Link>
                        </div>
                    </div> {/* --- End Left Column --- */}


                    {/* --- Right Column (Iframe & Logo with Frosted Glass) --- */}
                    {/* Restored original structure as requested */}
                    <div className="w-full md:w-1/3 mt-6 md:mt-0 flex flex-col items-center justify-center p-4 rounded-lg">
                        {/* Container for the blur div (conditionally rendered) and the iframe */}
                        {/* Ensured parent has relative positioning */}
                        <div className="relative w-[200px] h-[220px]"> {/* Added explicit size to parent to match iframe */}
                            {/* Conditionally render the blur div with absolute positioning */}
                            {/* Show blur effect only when alipayFormHtml is null or empty */}
                            {!alipayFormHtml && (
                                <div className="absolute inset-0 backdrop-blur-xs z-10 rounded-lg"
                                    style={{ pointerEvents: 'none' }}>
                                </div>
                            )}
                            {/* Iframe - positioned within the relative parent */}
                            <iframe
                                ref={iframeRef}
                                title="Alipay Payment Frame"
                                className="rounded-lg" /* Added rounded-lg to match overlay */
                                style={{
                                    width: '100%', // Use 100% to fill parent
                                    height: '100%', // Use 100% to fill parent
                                    border: 'none',
                                    // Removed z-index and position relative from iframe itself
                                }}
                                sandbox="allow-forms allow-scripts allow-same-origin"
                                // Use srcDoc directly. If alipayFormHtml is null, show placeholder.
                                srcDoc={alipayFormHtml || `<!DOCTYPE html>
                                         <html style="height: 100%;">
                                         <head><meta charset="UTF-8"></head>
                                         <body style="margin: 0; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9;">
                                             <img src="/qr_code_example.png" alt="Scan QR Code" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                                         </body>
                                         </html>`}
                            />
                        </div>
                        {/* Logo below iframe */}
                        <div className="mt-4">
                            <Image src="/alipay_logo.png" alt="支持支付宝" width={96} height={96} title="支持支付宝付款" />
                        </div>
                         {/* Polling status indicator - Use currentOrderId */}
                        {currentOrderId && (
                            <div className="mt-2 text-sm text-gray-600 animate-pulse">
                                正在确认支付结果...
                            </div>
                        )}
                    </div> {/* --- End Right Column --- */}

                </div> // End Flex container
            )}

            {/* Footer remains at the bottom */}
            <div className="mt-10 text-center text-gray-500 text-sm">
                {/* Footer content */}
            </div>
        </div>
    </div>
  );
} 