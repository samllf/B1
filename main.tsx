import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import App from './App';
import { initMockData } from './api/mock';
import './index.css';

initMockData();

function ThemedRoot() {
  const savedTheme = localStorage.getItem('theme-mode') || 'light';

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: savedTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff', borderRadius: 6 },
      }}
    >
      <Provider store={store}>
        <App />
      </Provider>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemedRoot />
  </React.StrictMode>
);
