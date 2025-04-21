'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function AlipayCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const authCode = searchParams.get('auth_code');
    const state = searchParams.get('state');
    const error = searchParams.get('error'); // Check for errors from Alipay
    const storedState = sessionStorage.getItem('alipay_oauth_state');

    sessionStorage.removeItem('alipay_oauth_state');

    if (error) {
      console.error('Alipay OAuth Error:', error);
      toast.error(`支付宝授权失败: ${error}`);
      router.push('/'); // Redirect to home on error
      return;
    }

    if (!state || state !== storedState) {
      console.error('Alipay OAuth State mismatch', { received: state, expected: storedState });
      toast.error('支付宝授权状态无效，请重试');
      router.push('/'); // Redirect to home on state mismatch
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
            // Store user info in localStorage
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('token', data.token);
            localStorage.setItem('remainWords', String(data.remain_words));
            localStorage.setItem('isLoggedIn', 'true'); // Flag to indicate login status
            
            console.log('Login successful, user data stored.', data);
            toast.success('登录成功!');
          } else {
             throw new Error('从后端返回的用户数据不完整。');
          }

        } catch (error) {
          console.error('Login API Error:', error);
          toast.error(error instanceof Error ? error.message : '登录过程中发生错误');
          // Clear any potentially partially stored data on error
          localStorage.removeItem('userId');
          localStorage.removeItem('token');
          localStorage.removeItem('remainWords');
          localStorage.removeItem('isLoggedIn');
        } finally {
           // Always redirect home, whether login succeeded or failed
           router.push('/');
        }
      };

      login(); // Execute the async login function

    } else {
      console.error('Alipay OAuth: auth_code not found in callback URL');
      toast.error('未获取到支付宝授权码');
      router.push('/'); // Redirect to home if code is missing
    }

  }, [searchParams, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      处理支付宝回调中...
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