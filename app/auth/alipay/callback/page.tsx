'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Define the origin for postMessage for better security
// Ideally, this should come from an environment variable
const PARENT_WINDOW_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || '*'; // Use '*' as fallback, but specific origin is recommended

function AlipayCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authCode = searchParams.get('auth_code');
    const state = searchParams.get('state');
    const error = searchParams.get('error'); // Check for errors from Alipay
    const storedState = sessionStorage.getItem('alipay_oauth_state');

    sessionStorage.removeItem('alipay_oauth_state');

    if (error) {
      console.error('Alipay OAuth Error:', error);
      // Send error message to parent window instead of redirecting
      window.parent.postMessage({ type: 'alipayLoginError', message: `支付宝授权失败: ${error}` }, PARENT_WINDOW_ORIGIN);
      return;
    }

    if (!state || state !== storedState) {
      console.error('Alipay OAuth State mismatch', { received: state, expected: storedState });
      // Send error message to parent window instead of redirecting
      window.parent.postMessage({ type: 'alipayLoginError', message: '支付宝授权状态无效，请重试' }, PARENT_WINDOW_ORIGIN);
      return;
    }

    if (authCode) {
      // --- Call your backend API --- 
      const login = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // Needs NEXT_PUBLIC_ prefix for client-side
          const response = await fetch(`${baseUrl}/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: authCode })
          });

          if (!response.ok) {
            // Try to get error message from backend response
            let errorMsg = `登录失败: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch(jsonError) {
                // Ignore if response is not JSON
            }
            throw new Error(errorMsg);
          }

          const data = await response.json();

          if (data.user_id && data.token && data.remain_words !== undefined) {
            // IMPORTANT: Do NOT store in localStorage here. Let the parent window handle it.
            console.log('Login successful, sending data to parent window.', data);
            // Send success message with payload to parent window
            window.parent.postMessage({ type: 'alipayLoginSuccess', payload: data }, PARENT_WINDOW_ORIGIN);
          } else {
             throw new Error('从后端返回的用户数据不完整。');
          }

        } catch (error: any) { // Explicitly type error
          console.error('Login API Error:', error);
          // Send error message to parent window
          window.parent.postMessage({ type: 'alipayLoginError', message: error.message || '登录过程中发生未知错误' }, PARENT_WINDOW_ORIGIN);
        } 
      };

      login(); // Execute the async login function

    } else {
      console.error('Alipay OAuth: auth_code not found in callback URL');
      // Send error message to parent window instead of redirecting
      window.parent.postMessage({ type: 'alipayLoginError', message: '未获取到支付宝授权码' }, PARENT_WINDOW_ORIGIN);
    }

  }, [searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#666' }}>
      正在处理支付宝登录回调，请稍候...
    </div>
  );
}

// Wrap with Suspense because useSearchParams might suspend
export default function AlipayCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
       <AlipayCallbackContent />
    </Suspense>
  );
} 