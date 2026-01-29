// src/components/ui/Modal.tsx
import React, { useEffect } from 'react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      // Use a timeout to ensure the check runs after the DOM has updated.
      setTimeout(() => {
        const otherModals = document.querySelectorAll('.custom-modal-backdrop')
        if (otherModals.length === 0) {
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
        }
      }, 0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-white/50 z-50 flex justify-center items-center custom-modal-backdrop"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-xl transition-all duration-300 ease-in-out',
          className,
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold -mt-2 -mr-2 p-2"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="p-6 bg-gray-50 rounded-b-lg border-t flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
