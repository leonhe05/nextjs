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
      // Revert to toast and redirect
      toast.error(`支付宝授权失败: ${error}`);
      router.push('/'); // Restore redirect
      return;
    }

    if (!state || state !== storedState) {
      console.error('Alipay OAuth State mismatch', { received: state, expected: storedState });
      // Revert to toast and redirect
      toast.error('支付宝授权状态无效，请重试');
      router.push('/'); // Restore redirect
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
            // Restore storing in localStorage
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('token', data.token);
            localStorage.setItem('remainWords', String(data.remain_words));
            localStorage.setItem('isLoggedIn', 'true'); 
            
            console.log('Login successful, user data stored.', data);
            toast.success('登录成功'); // Restore toast
          } else {
             throw new Error('从后端返回的用户数据不完整。');
          }

        } catch (error: any) { // Explicitly type error
          console.error('Login API Error:', error);
          // Revert to toast and clearing local storage
          toast.error(error.message || '登录过程中发生未知错误');
          localStorage.removeItem('userId');
          localStorage.removeItem('token');
          localStorage.removeItem('remainWords');
          localStorage.removeItem('isLoggedIn');
        } finally {
           // Restore the finally block that redirects
           router.push('/');
        }
      };

      login(); // Execute the async login function

    } else {
      console.error('Alipay OAuth: auth_code not found in callback URL');
      // Revert to toast and redirect
      toast.error('未获取到支付宝授权码');
      router.push('/'); // Restore redirect
    }

  }, [searchParams, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      登录中...
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