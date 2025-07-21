'use client'; // Chỉ thị này báo cho Next.js biết rằng component này được render ở phía client (trình duyệt).

// Import các thư viện và hook cần thiết từ React và Ant Design
import React, { memo, useMemo, useCallback } from 'react'; // React core: memo để tối ưu hiệu suất, useMemo và useCallback để ghi nhớ giá trị/hàm.
import { Card, Row, Col, Statistic, Typography, Alert, Badge, Space, Spin, Button } from 'antd'; // Ant Design UI components.

// Import các icon từ Ant Design.
import {
  TrophyOutlined, // Icon chiếc cúp
  FallOutlined,    // Icon mũi tên giảm (cho giá giảm)
  RiseOutlined,    // Icon mũi tên tăng (cho giá tăng)
  ExclamationCircleOutlined, // Icon dấu chấm than trong vòng tròn (cho lỗi)
  DotChartOutlined, // Icon biểu đồ chấm (cho dữ liệu thời gian thực)
  RocketOutlined,  // Icon tên lửa (cho Demo Hub)
  CheckOutlined    // Icon dấu tích (cho coin đã chọn)
} from '@ant-design/icons';

import Link from 'next/link'; // Component Link của Next.js để điều hướng giữa các trang mà không cần tải lại toàn bộ trang.

// Import các hook và utility functions từ các file nội bộ trong dự án.
import { useTrading, CoinSymbol } from '../contexts/TradingContext'; // Hook và kiểu dữ liệu từ TradingContext để quản lý trạng thái giao dịch và coin.
import { useTranslations } from '../contexts/LanguageContext'; // Hook từ LanguageContext để truy cập các chuỗi dịch thuật (đa ngôn ngữ).
import { getSmartPrecision, isMicroCapToken, formatSmartPrice } from '../lib/priceFormatter'; // Các hàm tiện ích để định dạng giá thông minh, phát hiện token micro-cap, v.v.
import { usePerformanceMonitor } from './optimized/LazyComponents'; // Hook để theo dõi hiệu suất của component (từ module tối ưu hóa).
import { MarketSkeleton } from './skeletons/MarketSkeleton';

// Destructuring các component Typography từ Ant Design để sử dụng ngắn gọn hơn.
const { Text, Title } = Typography;

// Định nghĩa thông tin cơ bản cho các đồng coin chính bao gồm tên, icon và màu sắc đặc trưng.
// Đây là một hằng số, không thay đổi trong quá trình chạy ứng dụng.
const COIN_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },   // Bitcoin: biểu tượng '₿', màu cam.
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },   // Ethereum: biểu tượng 'Ξ', màu tím xanh.
  PEPE: { name: 'Pepe', icon: '🐸', color: '#4caf50' }      // Pepe: biểu tượng '🐸', màu xanh lá cây.
};

// Hàm trợ giúp: `getSmartStatisticProps`
// Chức năng: Tạo ra các props tùy chỉnh cho component Ant Design `Statistic` dựa trên giá trị của coin.
// Nó giúp định dạng giá hiển thị (số lượng chữ số sau dấu phẩy, kiểu chữ, cỡ chữ) một cách thông minh,
// đặc biệt quan trọng với các token có giá trị rất nhỏ (micro-cap tokens) như PEPE.
const getSmartStatisticProps = (value: number) => {
  // `getSmartPrecision(value)`: Hàm này xác định số lượng chữ số thập phân và liệu có nên sử dụng ký hiệu khoa học hay không
  // dựa trên độ lớn của giá trị. Ví dụ, với 0.00000001 nó sẽ dùng ký hiệu khoa học hoặc nhiều số thập phân.
  const precision = getSmartPrecision(value);
  // `isMicroCapToken(value)`: Hàm này kiểm tra xem giá trị có đủ nhỏ để được coi là một token micro-cap hay không.
  const isMicroCap = isMicroCapToken(value);

  return {
    // `precision.useScientific ? 2 : precision.precision`: Nếu cần dùng ký hiệu khoa học, làm tròn đến 2 chữ số; ngược lại, dùng độ chính xác đã tính.
    precision: precision.useScientific ? 2 : precision.precision,
    valueStyle: {
      fontFamily: 'monospace', // Sử dụng font monospace để hiển thị số rõ ràng hơn.
      fontSize: isMicroCap ? 14 : 16, // Giảm kích thước font cho các token micro-cap để tiết kiệm không gian.
      fontWeight: 600,                 // Đậm hơn để dễ đọc.
      ...(precision.useScientific && {  // Nếu là ký hiệu khoa học, điều chỉnh thêm kích thước và khoảng cách chữ.
        fontSize: 12,
        letterSpacing: '0.5px'
      })
    },
    formatter: precision.useScientific // Nếu dùng ký hiệu khoa học, cung cấp một hàm formatter cho Ant Design Statistic.
      ? (val: any) => {
          const numVal = typeof val === 'string' ? parseFloat(val) : val; // Đảm bảo giá trị là số.
          return numVal.toExponential(2); // Định dạng thành ký hiệu khoa học với 2 chữ số thập phân.
        }
      : undefined // Nếu không dùng ký hiệu khoa học, để Ant Design tự định dạng mặc định (hoặc dùng hàm formatter khác).
  };
};

// Hàm trợ giúp: `getSmartBadgeStyle`
// Chức năng: Định kiểu cho component Ant Design `Badge` (thường dùng để hiển thị phần trăm thay đổi 24h)
// dựa trên giá trị thay đổi (tăng/giảm) và liệu đó có phải là token micro-cap hay không.
const getSmartBadgeStyle = (change: number, isMicroCap: boolean) => ({
  backgroundColor: change >= 0 ? '#52c41a' : '#ff4d4f', // Nền xanh nếu tăng, đỏ nếu giảm.
  fontSize: isMicroCap ? 10 : 11,                       // Giảm kích thước font cho micro-cap để phù hợp với không gian nhỏ.
  fontWeight: 500,                                      // Đậm hơn.
  padding: isMicroCap ? '1px 4px' : '2px 6px'          // Giảm padding cho micro-cap.
});

// Component chính: `MarketSelector`
// Đây là một Functional Component của React.
// `memo()`: Là một Higher-Order Component (HOC) từ React. Nó giúp tối ưu hóa hiệu suất bằng cách ghi nhớ kết quả render của component
// và chỉ re-render lại nếu props của nó thay đổi. Điều này rất hữu ích cho các component hiển thị dữ liệu thị trường cập nhật liên tục.
const MarketSelector = memo(() => {
  // `useTrading()`: Một custom hook để truy cập trạng thái và các hàm từ `TradingContext`.
  // Bao gồm: `selectedCoin` (đồng coin hiện tại được chọn), `setSelectedCoin` (hàm để thay đổi đồng coin),
  // `coinsData` (dữ liệu thị trường của tất cả các đồng coin), `isLoading` (trạng thái tải dữ liệu), `error` (thông báo lỗi).
  const { selectedCoin, setSelectedCoin, coinsData, isLoading, error } = useTrading();
  // `useTranslations()`: Một custom hook để truy cập các chuỗi dịch thuật (từ file `translations.ts`).
  const t = useTranslations();

  // `usePerformanceMonitor('MarketSelector')`: Một custom hook để theo dõi hiệu suất của component này.
  // Nó sẽ ghi lại số lần component render và thời gian render, hữu ích cho việc tối ưu hóa.
  usePerformanceMonitor('MarketSelector');

  // `handleCoinSelect`: Hàm xử lý sự kiện khi người dùng chọn một đồng coin mới.
  // `useCallback()`: Ghi nhớ hàm này. Hàm sẽ chỉ được tạo lại nếu `selectedCoin` hoặc `setSelectedCoin` thay đổi.
  // Điều này giúp ngăn chặn các re-render không cần thiết của các component con nhận hàm này làm prop.
  const handleCoinSelect = useCallback((coin: CoinSymbol) => {
    // Chỉ cập nhật nếu đồng coin được chọn thực sự thay đổi để tránh re-render không cần thiết.
    if (coin !== selectedCoin) {
      setSelectedCoin(coin); // Cập nhật trạng thái `selectedCoin` trong `TradingContext`.
    }
  }, [selectedCoin, setSelectedCoin]); // Dependencies: hàm sẽ được ghi nhớ cho đến khi `selectedCoin` hoặc `setSelectedCoin` thay đổi.

  // `processedCoinsData`: Dữ liệu về các đồng coin đã được xử lý để dễ dàng render.
  // `useMemo()`: Ghi nhớ giá trị này. Giá trị sẽ chỉ được tính toán lại nếu `coinsData` hoặc `selectedCoin` thay đổi.
  const processedCoinsData = useMemo(() => {
    // `Object.entries(coinsData)`: Chuyển đổi đối tượng `coinsData` thành một mảng các cặp [key, value].
    return Object.entries(coinsData).map(([coin, data]) => ({
      coin: coin as CoinSymbol, // Chuyển đổi key thành kiểu `CoinSymbol`.
      data,                    // Dữ liệu của đồng coin.
      isSelected: coin === selectedCoin // Thêm thuộc tính `isSelected` để kiểm tra xem coin này có đang được chọn hay không.
    }));
  }, [coinsData, selectedCoin]); // Dependencies: giá trị sẽ được ghi nhớ cho đến khi `coinsData` hoặc `selectedCoin` thay đổi.

  // Hiển thị thông báo lỗi nếu có lỗi khi tải dữ liệu.
  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu thị trường" // Tiêu đề lỗi.
        description={error}                   // Mô tả lỗi chi tiết.
        type="error"                          // Loại thông báo là lỗi (màu đỏ).
        showIcon                              // Hiển thị icon lỗi.
        icon={<ExclamationCircleOutlined />} // Icon cụ thể cho lỗi.
        style={{ marginBottom: 16 }}          // Khoảng cách dưới.
      />
    );
  }

  // Hiển thị skeleton (hiệu ứng tải) trong quá trình tải dữ liệu ban đầu.
  // Điều kiện: đang tải (`isLoading` là true) VÀ chưa có dữ liệu nào (`coinsData` rỗng).
  if (isLoading && Object.keys(coinsData).length === 0) {
    return <MarketSkeleton />; // Render component skeleton.
  }

  // Phần render chính của component MarketSelector.
  return (
    // `Space` (Ant Design): Component giúp tạo khoảng cách giữa các phần tử theo hướng dọc (`direction="vertical"`).
    // `size="large"`: Khoảng cách lớn giữa các phần tử con.
    // `style={{ width: '100%' }}`: Chiếm toàn bộ chiều rộng.
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Khối Card để truy cập các Hub giao dịch (Production/Demo) */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Tiêu đề phần "Advanced Trading System" */}
          <div>
            <Title level={4} style={{ margin: 0 }}>
              🚀 Advanced Trading System
            </Title>
            <Text type="secondary">
              Professional trading platform với production features và demo environment
            </Text>
          </div>
          {/* Các nút điều hướng đến Production Hub và Demo Hub */}
          <Space>
            <Link href="/production-hub"> {/* Link tới trang Production Hub */}
              <Button type="primary" icon={<TrophyOutlined />} size="large">
                Production Hub
              </Button>
            </Link>
            <Link href="/demo-hub"> {/* Link tới trang Demo Hub */}
              <Button icon={<RocketOutlined />} size="large">
                Demo Hub
              </Button>
            </Link>
          </Space>
        </div>
      </Card>

      {/* Khối Card để hiển thị tổng quan thị trường và lựa chọn Coin */}
      <Card
        title={ // Tiêu đề của Card
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              📊 Thị trường & Chọn Coin
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Click vào coin để chọn cho trading
            </Text>
          </div>
        }
      >
        {/* `Row` (Ant Design): Tạo một hàng trong hệ thống lưới (grid system). */}
        {/* `gutter={[16, 16]}`: Khoảng cách 16px giữa các cột theo cả chiều ngang và dọc. */}
        <Row gutter={[16, 16]}>
          {/* Lặp qua mảng `processedCoinsData` để render Card cho từng đồng coin */}
          {processedCoinsData.map(({ coin, data, isSelected }) => {
            const coinInfo = COIN_INFO[coin]; // Lấy thông tin chi tiết về coin (tên, icon, màu) từ hằng số COIN_INFO.

            return (
              // `Col` (Ant Design): Tạo một cột trong hệ thống lưới.
              // `xs={24}`: Trên màn hình cực nhỏ (extra small), cột chiếm toàn bộ chiều rộng (24 đơn vị).
              // `md={8}`: Trên màn hình trung bình trở lên (medium), cột chiếm 1/3 chiều rộng (8 đơn vị, 3 cột trên một hàng).
              // `key={coin}`: Key duy nhất cho mỗi phần tử trong danh sách, cần thiết cho React.
              <Col xs={24} md={8} key={coin}>
                <Card
                  hoverable // Hiệu ứng hover (thay đổi khi di chuột qua).
                  onClick={() => handleCoinSelect(coin)} // Gọi hàm `handleCoinSelect` khi Card được nhấp.
                  style={{
                    height: '100%',                             // Đảm bảo Card có chiều cao bằng nhau trong một hàng.
                    borderColor: isSelected ? '#1890ff' : undefined, // Màu viền xanh nếu coin đang được chọn.
                    borderWidth: isSelected ? 2 : 1,             // Viền dày hơn nếu đang chọn.
                    transform: isSelected ? 'scale(1.02)' : undefined, // Phóng to nhẹ nếu đang chọn.
                    transition: 'all 0.3s ease',                 // Hiệu ứng chuyển động mượt mà.
                    cursor: 'pointer',                           // Con trỏ thành hình bàn tay để chỉ ra có thể nhấp.
                    boxShadow: isSelected ? '0 4px 20px rgba(24, 144, 255, 0.3)' : undefined // Đổ bóng mạnh hơn nếu đang chọn.
                  }}
                  styles={{ body: { padding: 20 } }} // Padding bên trong body của Card.
                >
                  {/* Phần Header của Card coin: chứa thông tin coin và chỉ báo chọn/thay đổi 24h */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Icon của Coin */}
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 12, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'white',
                          fontWeight: 'bold', fontSize: 16,
                          background: `linear-gradient(135deg, ${coinInfo.color}, ${coinInfo.color}CC)`, // Nền gradient dựa trên màu coin.
                          boxShadow: `0 4px 14px 0 ${coinInfo.color}40` // Đổ bóng nhẹ.
                        }}
                      >
                        {coinInfo.icon} {/* Hiển thị icon của đồng coin. */}
                      </div>
                      {/* Tên và Symbol của Coin */}
                      <div>
                        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                          {coin} {/* Symbol của coin (ví dụ: BTC) */}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {coinInfo.name} {/* Tên đầy đủ của coin (ví dụ: Bitcoin) */}
                        </Text>
                      </div>
                    </div>
                    {/* Chỉ báo Coin đang được chọn và Badge hiển thị phần trăm thay đổi 24h */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isSelected && ( // Chỉ hiển thị nếu coin đang được chọn
                        <CheckOutlined 
                          style={{ 
                            color: '#1890ff', fontSize: 16,
                            backgroundColor: '#e6f7ff', padding: 4, borderRadius: '50%'
                          }} 
                        />
                      )}
                      <Badge
                        // `count`: Nội dung hiển thị trong Badge (phần trăm thay đổi 24h).
                        // `data.change24h >= 0 ? '+' : ''`: Thêm dấu '+' nếu là số dương.
                        // `toFixed(isMicroCapToken(data.price) ? 4 : 2)`: Làm tròn 4 chữ số cho micro-cap, 2 chữ số cho phần còn lại.
                        count={`${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(isMicroCapToken(data.price) ? 4 : 2)}%`}
                        // `style`: Áp dụng style thông minh dựa trên `getSmartBadgeStyle` để thay đổi màu nền và font size.
                        style={getSmartBadgeStyle(data.change24h, isMicroCapToken(data.price))}
                      />
                    </div>
                  </div>

                  {/* Dữ liệu giá và thị trường của Coin */}
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Statistic
                      title={t.trading.price} // Tiêu đề "Giá" (được dịch từ t.trading.price).
                      value={isLoading ? 0 : data.price} // Giá trị: nếu đang tải thì 0, ngược lại là giá coin.
                      // `...getSmartStatisticProps(data.price)`: Áp dụng các props định dạng thông minh đã tạo ở trên.
                      {...getSmartStatisticProps(data.price)} 
                      prefix="$" // Tiền tố là "$".
                      loading={isLoading} // Hiển thị hiệu ứng tải nếu đang tải.
                    />

                    <Row gutter={8}> {/* Hàng con để hiển thị giá Cao và Thấp */}
                      <Col span={12}>
                        <Statistic
                          title="Cao" // Tiêu đề "Cao"
                          value={data.high} // Giá cao nhất 24h.
                          {...getSmartStatisticProps(data.high)} // Áp dụng định dạng thông minh.
                          prefix="$"
                          valueStyle={{
                            ...getSmartStatisticProps(data.high).valueStyle,
                            color: '#52c41a', // Màu xanh cho giá cao.
                            fontSize: isMicroCapToken(data.high) ? 11 : 12 // Kích thước font.
                          }}
                          suffix={<RiseOutlined style={{ color: '#52c41a', fontSize: 10 }} />} // Icon mũi tên tăng.
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Thấp" // Tiêu đề "Thấp"
                          value={data.low} // Giá thấp nhất 24h.
                          {...getSmartStatisticProps(data.low)} // Áp dụng định dạng thông minh.
                          prefix="$"
                          valueStyle={{
                            ...getSmartStatisticProps(data.low).valueStyle,
                            color: '#ff4d4f', // Màu đỏ cho giá thấp.
                            fontSize: isMicroCapToken(data.low) ? 11 : 12 // Kích thước font.
                          }}
                          suffix={<FallOutlined style={{ color: '#ff4d4f', fontSize: 10 }} />} // Icon mũi tên giảm.
                        />
                      </Col>
                    </Row>

                    <Statistic
                      title={t.trading.volume} // Tiêu đề "Khối lượng" (được dịch).
                      value={(data.volume / 1000000).toFixed(2)} // Khối lượng được chia cho 1 triệu và làm tròn 2 chữ số.
                      suffix="M" // Hậu tố là "M" (triệu).
                      valueStyle={{
                        fontFamily: 'monospace',
                        fontSize: 12
                      }}
                      prefix={<TrophyOutlined style={{ fontSize: 10 }} />} // Icon chiếc cúp.
                    />
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Khối Card hiển thị trạng thái dữ liệu thời gian thực */}
      <Card size="small" style={{ textAlign: 'center' }}>
        <Space size="middle" align="center">
          <Badge status="processing" /> {/* Icon chấm tròn nhấp nháy, biểu thị dữ liệu đang được xử lý/cập nhật. */}
          <Text type="secondary" style={{ fontSize: 12 }}>Live Data</Text> {/* Văn bản "Dữ liệu Trực tiếp" */}
          <Text type="secondary" style={{ fontSize: 12 }}>•</Text> {/* Dấu chấm tròn ngăn cách */}
          <Text type="secondary" style={{ fontSize: 12 }}>Updates every 5 seconds</Text> {/* Văn bản "Cập nhật mỗi 5 giây" */}
          <Text type="secondary" style={{ fontSize: 12 }}>•</Text> {/* Dấu chấm tròn ngăn cách */}
          <Text type="secondary" style={{ fontSize: 12 }}>Binance Testnet</Text> {/* Văn bản "Binance Testnet" */}
          <DotChartOutlined style={{ color: '#52c41a' }} /> {/* Icon biểu đồ chấm, màu xanh lá cây, biểu thị kết nối dữ liệu. */}
        </Space>
      </Card>
    </Space>
  );
});

// Thiết lập `displayName` cho component memoized để cải thiện khả năng debug trong React DevTools.
MarketSelector.displayName = 'MarketSelector';

// Export component để có thể sử dụng ở các file khác.
export default MarketSelector;