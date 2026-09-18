'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client' // Таны төслийн supabase client импортлох зам
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // 1. Нууц үг хоорондоо таарч байгаа эсэхийг шалгах
    if (password !== confirmPassword) {
      setError('Нууц үг хоорондоо таарахгүй байна.')
      setLoading(false)
      return
    }

    // 2. Supabase updateUser ашиглан нууц үгийг шинэчлэх
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Нууц үг амжилттай шинэчлэгдлээ! Түр хүлээнэ үү...')
      setTimeout(() => {
        router.push('/login') // Амжилттай солигдсоны дараа нэвтрэх хуудас руу шилжүүлэх
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleUpdatePassword} className="w-full max-w-md space-y-4 p-6 rounded-lg shadow-md bg-white text-black">
        <h1 className="text-xl font-bold">Шинэ нууц үг оруулах</h1>
        
        <div>
          <label className="block text-sm font-medium">Шинэ нууц үг</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Нууц үгээ давтан оруулна уу</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading.toString() === 'true' || loading ? 'Хүлээгдэж байна...' : 'Нууц үг шинэчлэх'}
        </button>
      </form>
    </div>
  )
}