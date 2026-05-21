import React from 'react';
import { useSelector } from 'react-redux';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { RootState } from './store';
import AppLayout from './components/Layout/AppLayout';

const App: React.FC = () => {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const isBigScreen = useSelector((state: RootState) => state.ui.isBigScreen);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff', borderRadius: 6 },
      }}
    >
      <div
        className={isBigScreen ? 'big-screen-mode' : ''}
        data-theme={themeMode}
        style={{ height: '100%', width: '100%' }}
      >
        <AppLayout />
      </div>
    </ConfigProvider>
  );
};

export default App;
