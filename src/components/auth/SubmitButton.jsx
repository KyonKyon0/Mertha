'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, pendingText, className, ...props }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={className || "w-full block text-center bg-mertha-primary text-white font-bold py-3.5 rounded-xl hover:bg-mertha-primary/90 mt-4 shadow-lg shadow-mertha-primary/30 disabled:opacity-50"}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  )
}
