'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Төслийнхөө замтай тохируулаарай

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // URL дээрх #hash утгуудыг шалгах
    const hash = window.location.hash
    
    if (hash && hash.includes('type=recovery')) {
      // Auth төлөв өөрчлөгдөхийг хүлээх
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) {
          // Амжилттай сесс үүссэн бол нууц үг солих хуудас руу шилжүүлэх
          router.push('/reset-password')
        }
      })

      // Компонент устгагдах үед listener-ийг цэвэрлэх (Memory leak-ээс сэргийлэх)
      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Хэрэв token эсвэл recovery төрөл байхгүй бол алдаатай руу буцаах
      router.push('/login?error=Invalid recovery link')
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Баталгаажуулж байна, түр хүлээнэ үү...</p>
    </div>
  )
}