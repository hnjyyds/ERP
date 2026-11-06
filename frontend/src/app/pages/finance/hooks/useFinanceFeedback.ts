import { useState } from 'react'

export function useFinanceFeedback() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  return { message, setMessage, error, setError }
}
