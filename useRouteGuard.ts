import { useCallback } from 'react';
import { Modal } from 'antd';

export function useRouteGuard(hasUnsavedChanges: boolean) {
  const confirmNavigation = useCallback(
    (onConfirm: () => void) => {
      if (hasUnsavedChanges) {
        Modal.confirm({
          title: '确认离开',
          content: '您有未保存的更改，确定要离开吗？',
          okText: '确定离开',
          cancelText: '继续编辑',
          onOk: () => {
            onConfirm();
          },
        });
        return false;
      }
      return true;
    },
    [hasUnsavedChanges]
  );

  return { confirmNavigation };
}
