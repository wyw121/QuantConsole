import { Database, Globe, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

interface DataSourceNotificationProps {
  dataSource: "mock" | "real";
  isConnected: boolean;
  show: boolean;
  onHide: () => void;
}

export const DataSourceNotification: React.FC<DataSourceNotificationProps> = ({
  dataSource,
  isConnected,
  show,
  onHide,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // 3秒后自动隐藏
      const timer = setTimeout(() => {
        setVisible(false);
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!visible) return null;

  const getIcon = () => {
    if (!isConnected) {
      return <XCircle className="w-6 h-6 text-red-400" />;
    }
    return dataSource === "real" ? (
      <Globe className="w-6 h-6 text-green-400" />
    ) : (
      <Database className="w-6 h-6 text-blue-400" />
    );
  };

  const getMessage = () => {
    if (!isConnected) {
      return `${dataSource === "real" ? "真实" : "模拟"}数据连接失败`;
    }
    return `已切换到${dataSource === "real" ? "真实" : "模拟"}数据源`;
  };

  const getBgColor = () => {
    if (!isConnected) return "bg-red-600";
    return dataSource === "real" ? "bg-green-600" : "bg-blue-600";
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-4 fade-in">
      <div className={`${getBgColor()} rounded-lg p-4 shadow-lg max-w-sm`}>
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div className="text-white">
            <div className="font-medium">{getMessage()}</div>
            <div className="text-sm opacity-90">
              {isConnected ? "数据正在实时更新" : "请检查网络连接"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
