"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast"; // Import Toaster

export default function PurchasePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // Add state for user ID

  useEffect(() => {
    setIsClient(true);
    // Get user ID from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const plans = [
    { id: "plan1", name: "2千字", price: "0.5元", unitPrice: "0.25元/千字" },
    { id: "plan2", name: "1万字", price: "2元", unitPrice: "0.2元/千字" },
    { id: "plan3", name: "10万字", price: "18元", unitPrice: "0.18元/千字" },
    { id: "plan4", name: "100万字", price: "138元", unitPrice: "0.138元/千字" },
  ];

  const handlePayment = () => {
    if (!selectedPlan) {
      toast.error("请选择一种套餐");
      return;
    }
    const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
    toast.success(`已选择套餐：${selectedPlanDetails?.name}`);
    // TODO: Add actual Alipay payment integration logic here
    console.log("Initiating payment for plan:", selectedPlanDetails);
    // Placeholder for payment initiation
    toast.loading('正在跳转到支付页面...');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 font-[family-name:var(--font-geist-sans)]">
       {/* Add Toaster component here */}
       <Toaster position="top-center" reverseOrder={false} />
       {/* Add relative positioning to the main card */}
      <div className="relative max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 mt-10">
        {/* Add the logo absolutely positioned to the top right */}
        <div className="absolute top-6 right-12">
          <Image src="/alipay_logo.png" alt="支持支付宝" width={96} height={96} title="支持支付宝付款" />
        </div>
        {/* Wrap title and user ID in a flex container for alignment */}
        <div className="flex justify-center items-baseline gap-3 mb-10">
          {isClient && userId && (
            <span className="text-xl whitespace-nowrap">
              为用户 <span className="font-bold">{userId}</span> 购买语音合成字数
            </span>
          )}
        </div>

        {isClient && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    selectedPlan === plan.id
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">{plan.name}</h2>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{plan.price}</p>
                  <p className="text-sm text-gray-500">{plan.unitPrice}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handlePayment}
                disabled={!selectedPlan}
                className={`w-full max-w-xs px-8 py-3 rounded-lg transition-colors text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPlan ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                }`}
              >
               <span>支付宝支付</span>
              </button>
              <Link href="/" className="text-blue-500 hover:underline text-sm">
                返回首页
              </Link>
            </div>
          </>
        )}

        {/* Placeholder for payment instructions or QR code */}
        <div className="mt-10 text-center text-gray-500 text-sm">
            请选择套餐后点击支付。支付功能正在开发中。
        </div>
      </div>
    </div>
  );
} 