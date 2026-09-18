'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Client талын Supabase client

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // URL дээрх #hash утгуудыг шалгаж сесс үүсгэх
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      // Supabase client автоматаар hash дээрх token-ийг уншиж сесс болгоно
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) {
          router.push('/reset-password')
        }
      })
    } else {
      // Хэрэв код эсвэл token байхгүй бол нэвтрэх хуудас руу буцаах
      router.push('/login?error=Invalid recovery link')
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Баталгаажуулж байна, түр хүлээнэ үү...</p>
    </div>
  )
}
