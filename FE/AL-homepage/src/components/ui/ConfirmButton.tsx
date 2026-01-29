import * as React from 'react'
import { useAuthStore } from '../../store/authStore'
import { ADMINISH } from '../../utils/roles'
import type { Role } from '../../utils/roles'
import { Button } from './Button'

interface ConfirmButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  /**
   * 이 값이 true가 되면 버튼이 사라집니다.
   */
  isConfirmed: boolean
  /**
   * 버튼을 클릭했을 때 실행될 함수입니다.
   */
  onConfirm: () => void
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  className,
  isConfirmed,
  onConfirm,
  children,
  ...props
}) => {
  const { user } = useAuthStore()

  // 매니저 이상 권한 확인 (manager, admin, super_admin)
  const canConfirm = user && ADMINISH.includes(user.role as Role)

  // 권한이 없거나, 이미 확정된 상태이면 버튼을 렌더링하지 않음 (사라짐)
  if (!canConfirm || isConfirmed) {
    return null
  }

  return (
    <Button onClick={onConfirm} className={className} {...props}>
      {children}
    </Button>
  )
}

ConfirmButton.displayName = 'ConfirmButton'

export { ConfirmButton }
