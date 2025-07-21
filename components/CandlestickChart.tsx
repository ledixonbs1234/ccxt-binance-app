// File: components/CandlestickChart.tsx

'use client'; // Chỉ thị này báo cho Next.js rằng component này sẽ được render ở phía client (trình duyệt).

// Import các hàm và kiểu dữ liệu cần thiết từ thư viện 'lightweight-charts'.
import {
  createChart,       // Hàm chính để tạo biểu đồ.
  ColorType,         // Kiểu màu sắc (Solid, Transparent).
  LineStyle,         // Kiểu đường (Solid, Dashed, Dotted).
  IChartApi,         // Interface cho đối tượng biểu đồ chính.
  ISeriesApi,        // Interface cho đối tượng chuỗi dữ liệu (series - nến, đường, histogram).
  CandlestickData,   // Kiểu dữ liệu cho nến.
  HistogramData,     // Kiểu dữ liệu cho histogram (volume).
  Time,              // Kiểu dữ liệu thời gian của biểu đồ (number | string | Date).
  CandlestickSeries, // Loại chuỗi biểu đồ nến.
  LineSeries,        // Loại chuỗi biểu đồ đường.
  HistogramSeries,   // Loại chuỗi biểu đồ histogram.
  MouseEventParams,  // Tham số sự kiện chuột (cho tooltip).
  CrosshairMode,     // Chế độ crosshair (đường chữ thập khi di chuột).
} from 'lightweight-charts';

// Import các hook của React.
import { useEffect, useRef, useState, useCallback } from 'react';

// Import các hook và kiểu dữ liệu từ Contexts nội bộ của ứng dụng.
import { useTrading, Timeframe } from '../contexts/TradingContext'; // Để truy cập dữ liệu thị trường và khung thời gian.
import { useTranslations } from '../contexts/LanguageContext';     // Để truy cập các chuỗi dịch thuật (đa ngôn ngữ).

// Import các component UI tùy chỉnh.
import LoadingOverlay from './LoadingOverlay';     // Overlay hiển thị trạng thái tải.
import { ChartSkeleton } from './skeletons/MarketSkeleton'; // Component Skeleton khi biểu đồ đang tải.

// Import các kiểu dữ liệu và hàm tiện ích từ thư viện nội bộ.
import { TrailingStopPosition, TrailingStopSettings } from '../types/trailingStop'; // Kiểu dữ liệu cho vị thế Trailing Stop.
import { getSmartPrecision, formatSmartPrice, isMicroCapToken } from '../lib/priceFormatter'; // Hàm định dạng giá thông minh, phát hiện token micro-cap.
import { getActiveTrailingStops, TrailingStopState } from '../lib/trailingStopState';       // Hàm lấy trạng thái Trailing Stop đang hoạt động.
import { EnhancedTrailingStopService } from '../lib/enhancedTrailingStopService';           // Dịch vụ quản lý Trailing Stop nâng cao.

// Import các component overlay và legend cho biểu đồ.
import TrailingStopOverlay from './TrailingStopOverlay';       // Overlay hiển thị các đường Trailing Stop trên biểu đồ.
import StrategyIndicatorLegend from './StrategyIndicatorLegend'; // Legend cho các chỉ báo chiến lược.
import TrailingStopLegend from './TrailingStopLegend';         // Legend cho các đường Trailing Stop.
import { InlineTimeframeSelector } from './TimeframeSelector'; // Selector khung thời gian inline.

// =========================================================================
// INTERFACE - ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU
// =========================================================================

/**
 * Interface `TooltipData`
 * Mô tả: Cấu trúc dữ liệu cho thông tin hiển thị trên tooltip (thông báo) khi di chuột qua nến.
 */
interface TooltipData {
  time: string;           // Thời gian của nến.
  open: number;           // Giá mở cửa.
  high: number;           // Giá cao nhất.
  low: number;            // Giá thấp nhất.
  close: number;          // Giá đóng cửa.
  volume: number;         // Khối lượng giao dịch.
  change: number;         // Thay đổi giá giữa nến hiện tại và nến trước đó.
  changePercent: number;  // Phần trăm thay đổi giá.
  currentPrice: number;   // Giá trực tiếp hiện tại (từ `coinsData`).
  vsCurrentPriceChange: number; // Thay đổi giá của nến so với giá trực tiếp hiện tại.
  vsCurrentPricePercent: number; // Phần trăm thay đổi giá của nến so với giá trực tiếp hiện tại.
  isVisible: boolean;     // Trạng thái hiển thị của tooltip.
  x: number;              // Tọa độ X của tooltip trên màn hình.
  y: number;              // Tọa độ Y của tooltip trên màn hình.
}

// =========================================================================
// HÀM HỖ TRỢ ĐỊNH DẠNG GIÁ VÀ KHỐI LƯỢNG CHO BIỂU ĐỒ
// =========================================================================

/**
 * `formatChartPrice`
 * Chức năng: Định dạng giá cho hiển thị trên biểu đồ, đặc biệt xử lý tốt các token micro-cap.
 * Sử dụng `getSmartPrecision` để tự động điều chỉnh số chữ số thập phân hoặc dùng ký hiệu khoa học.
 * @param price : number - Giá trị cần định dạng.
 * @returns string - Chuỗi giá đã định dạng.
 */
const formatChartPrice = (price: number): string => {
  // Lấy đối tượng precision từ `getSmartPrecision` để xác định cách định dạng tốt nhất.
  const precision = getSmartPrecision(price);

  // Nếu `useScientific` là true (giá quá nhỏ).
  if (precision.useScientific) {
    // Định dạng bằng ký hiệu khoa học với số chữ số thập phân được tính.
    return price.toExponential(precision.precision);
  }
  // Nếu giá trị lớn (>= 1000).
  else if (price >= 1000) {
    // Định dạng với dấu phân cách hàng nghìn và 2 chữ số thập phân.
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  // Nếu giá trị trong khoảng [1, 1000).
  else if (price >= 1) {
    // Định dạng cố định với 4 chữ số thập phân.
    return price.toFixed(4);
  }
  // Nếu là token micro-cap (giá rất nhỏ nhưng lớn hơn 0).
  else if (isMicroCapToken(price)) {
    // Định dạng với độ chính xác cao và loại bỏ các số 0 cuối cùng để dễ đọc hơn.
    return parseFloat(price.toFixed(precision.precision)).toString();
  }
  // Các giá trị nhỏ khác.
  else {
    // Định dạng cố định với 6 chữ số thập phân.
    return price.toFixed(6);
  }
};

/**
 * `formatChartVolume`
 * Chức năng: Định dạng khối lượng giao dịch với các hậu tố (K, M, B) để dễ đọc.
 * @param volume : number - Giá trị khối lượng cần định dạng.
 * @returns string - Chuỗi khối lượng đã định dạng.
 */
const formatChartVolume = (volume: number): string => {
  if (volume >= 1e9) { // Nếu >= 1 tỷ (Billion).
    return (volume / 1e9).toFixed(2) + 'B';
  } else if (volume >= 1e6) { // Nếu >= 1 triệu (Million).
    return (volume / 1e6).toFixed(2) + 'M';
  } else if (volume >= 1e3) { // Nếu >= 1 nghìn (Kilo).
    return (volume / 1e3).toFixed(2) + 'K';
  }
  // Mặc định, định dạng số nguyên (không có chữ số thập phân).
  return volume.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// =========================================================================
// INTERFACE - ĐỊNH NGHĨA PROPS CHO COMPONENT CandlestickChart
// =========================================================================

/**
 * Interface `CandlestickChartProps`
 * Mô tả: Các props mà component `CandlestickChart` có thể nhận.
 */
interface CandlestickChartProps {
  height?: number;           // Chiều cao của biểu đồ (mặc định 450px).
  showControls?: boolean;    // Có hiển thị các nút điều khiển biểu đồ hay không (mặc định true).
  enhancedPositions?: TrailingStopPosition[]; // Vị thế Trailing Stop nâng cao (có thể được truyền từ bên ngoài).
}

// =========================================================================
// COMPONENT `CandlestickChart`
// =========================================================================

/**
 * `CandlestickChart`
 * Chức năng: Component React để hiển thị biểu đồ nến (hoặc đường) tương tác.
 * Nó lấy dữ liệu từ `TradingContext` và hiển thị các overlay cho Trailing Stop.
 * @param props : CandlestickChartProps - Các props được truyền vào component.
 */
export default function CandlestickChart({
  height = 450,       // Chiều cao mặc định của biểu đồ.
  showControls = true, // Mặc định hiển thị các nút điều khiển.
  enhancedPositions: externalPositions // Vị thế Trailing Stop từ bên ngoài (nếu có).
}: CandlestickChartProps = {}) { // Giá trị mặc định cho props.

  // `useRef` để giữ tham chiếu đến các đối tượng DOM và instance của biểu đồ LightWeight Charts.
  const chartContainerRef = useRef<HTMLDivElement>(null);      // Tham chiếu đến phần tử DOM chứa biểu đồ.
  const chartInstanceRef = useRef<IChartApi | null>(null);     // Tham chiếu đến instance của biểu đồ LightWeight Charts.
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line'> | null>(null); // Tham chiếu đến chuỗi dữ liệu giá (nến hoặc đường).
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);           // Tham chiếu đến chuỗi dữ liệu khối lượng.

  const t = useTranslations(); // Hook để truy cập các chuỗi dịch thuật.

  // `useTrading()`: Hook để truy cập dữ liệu thị trường từ `TradingContext`.
  // Bao gồm: `selectedCoin` (đồng coin được chọn), `allCandleData` (tất cả dữ liệu nến),
  // `timeframe` (khung thời gian hiện tại), `setTimeframe` (hàm để thay đổi khung thời gian),
  // `isLoading` (trạng thái tải của context), `coinsData` (dữ liệu các đồng coin).
  const { selectedCoin, candleData: allCandleData, timeframe, setTimeframe, isLoading: contextIsLoading, coinsData } = useTrading();

  // `useState` để quản lý trạng thái nội bộ của component.
  const [chartError, setChartError] = useState<string | null>(null);     // Thông báo lỗi của biểu đồ.
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle'); // Loại biểu đồ (nến hoặc đường).
  const [showVolume, setShowVolume] = useState(true);                  // Trạng thái hiển thị khối lượng.
  const [showTrailingStops, setShowTrailingStops] = useState(true);    // Trạng thái hiển thị các đường Trailing Stop.
  const [trailingStopPositions, setTrailingStopPositions] = useState<TrailingStopPosition[]>([]); // Vị thế Trailing Stop mô phỏng.
  const [activeTrailingStops, setActiveTrailingStops] = useState<TrailingStopState[]>([]);         // Trạng thái Trailing Stop từ API.
  const [enhancedService, setEnhancedService] = useState<EnhancedTrailingStopService | null>(null); // Dịch vụ Trailing Stop nâng cao.
  const [enhancedPositions, setEnhancedPositions] = useState<TrailingStopPosition[]>([]);         // Vị thế nâng cao (cho chỉ báo chiến lược).

  // `tooltipData`: Trạng thái cho thông tin hiển thị trên tooltip khi di chuột.
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    time: '', open: 0, high: 0, low: 0, close: 0, volume: 0,
    change: 0, changePercent: 0, currentPrice: 0,
    vsCurrentPriceChange: 0, vsCurrentPricePercent: 0,
    isVisible: false, x: 0, y: 0,
  });

  // `trailingStopLinesRef`: Tham chiếu đến Map lưu trữ các đối tượng PriceLine của LightWeight Charts cho Trailing Stop.
  const trailingStopLinesRef = useRef<Map<string, any>>(new Map());
  // `profitZonesRef`: Tham chiếu đến Map lưu trữ các vùng lợi nhuận (chưa được sử dụng trong mã này).
  const profitZonesRef = useRef<Map<string, any>>(new Map());

  // Lấy dữ liệu nến cho đồng coin hiện tại.
  const candleData = allCandleData[selectedCoin] || [];
  // Trạng thái tải: Đang tải từ context HOẶC không có dữ liệu nến cho đồng coin hiện tại.
  const isLoading = contextIsLoading || candleData.length === 0;

  // =========================================================================
  // HÀM QUẢN LÝ TRỰC QUAN HÓA TRAILING STOP
  // =========================================================================

  /**
   * `addTrailingStopVisualization`
   * Chức năng: Thêm các đường trực quan (entry, stop loss, activation) của một vị thế Trailing Stop lên biểu đồ.
   * `useCallback` để ghi nhớ hàm, tránh tạo lại không cần thiết.
   * @param position : TrailingStopPosition - Vị thế Trailing Stop cần trực quan hóa.
   */
  const addTrailingStopVisualization = useCallback((position: TrailingStopPosition) => {
    if (!chartInstanceRef.current || !priceSeriesRef.current) return; // Đảm bảo biểu đồ và chuỗi giá đã sẵn sàng.

    const chart = chartInstanceRef.current;
    const positionId = position.id;

    removeTrailingStopVisualization(positionId); // Xóa trực quan hóa cũ nếu có để tránh trùng lặp.

    try {
      // Định nghĩa đường giá Entry (màu xanh dương).
      const entryPriceLine = {
        price: position.entryPrice,
        color: '#3b82f6',
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true, // Hiển thị nhãn giá trên trục.
        title: `Entry: ${position.symbol}`, // Tiêu đề hiển thị khi hover.
      };

      // Định nghĩa đường giá Stop Loss hiện tại (màu đỏ).
      const stopLossPriceLine = {
        price: position.stopLossPrice,
        color: '#ef4444',
        lineStyle: LineStyle.Dashed, // Đường đứt nét.
        axisLabelVisible: true,
        title: `Stop: ${position.stopLossPrice.toFixed(4)}`,
      };

      // Định nghĩa đường giá Activation (màu cam) nếu vị thế đang chờ kích hoạt.
      let activationPriceLine = null;
      if (position.activationPrice && position.status === 'pending') {
        activationPriceLine = {
          price: position.activationPrice,
          color: '#f59e0b',
          lineStyle: LineStyle.Dotted, // Đường chấm chấm.
          axisLabelVisible: true,
          title: `Activation: ${position.activationPrice.toFixed(4)}`,
        };
      }

      // Tạo các đối tượng PriceLine và thêm vào chuỗi giá.
      const entryLine = priceSeriesRef.current.createPriceLine(entryPriceLine);
      const stopLine = priceSeriesRef.current.createPriceLine(stopLossPriceLine);
      const activationLine = activationPriceLine ? priceSeriesRef.current.createPriceLine(activationPriceLine) : null;

      // Lưu trữ tham chiếu đến các đường này trong `trailingStopLinesRef` để có thể xóa/cập nhật sau.
      trailingStopLinesRef.current.set(positionId, {
        entryLine, stopLine, activationLine, position
      });

    } catch (error) {
      console.error('Error adding trailing stop visualization:', error);
    }
  }, []); // Không có dependencies, hàm này sẽ được tạo một lần.

  /**
   * `removeTrailingStopVisualization`
   * Chức năng: Xóa các đường trực quan của một vị thế Trailing Stop khỏi biểu đồ.
   * `useCallback` để ghi nhớ hàm.
   * @param positionId : string - ID của vị thế cần xóa trực quan hóa.
   */
  const removeTrailingStopVisualization = useCallback((positionId: string) => {
    if (!priceSeriesRef.current) return; // Đảm bảo chuỗi giá đã sẵn sàng.

    const lines = trailingStopLinesRef.current.get(positionId); // Lấy các đường liên quan đến positionId.
    if (lines) {
      try {
        // Gỡ bỏ từng đường một khỏi chuỗi giá.
        if (lines.entryLine) priceSeriesRef.current.removePriceLine(lines.entryLine);
        if (lines.stopLine) priceSeriesRef.current.removePriceLine(lines.stopLine);
        if (lines.activationLine) priceSeriesRef.current.removePriceLine(lines.activationLine);
      } catch (error) {
        console.error('Error removing trailing stop visualization:', error);
      }
      trailingStopLinesRef.current.delete(positionId); // Xóa tham chiếu khỏi Map.
    }
  }, []); // Không có dependencies.

  /**
   * `updateTrailingStopVisualization`
   * Chức năng: Cập nhật trực quan hóa của một vị thế Trailing Stop.
   * Đơn giản là xóa và thêm lại các đường để chúng được vẽ lại với dữ liệu mới.
   * `useCallback` để ghi nhớ hàm.
   * @param position : TrailingStopPosition - Vị thế cần cập nhật.
   */
  const updateTrailingStopVisualization = useCallback((position: TrailingStopPosition) => {
    if (!showTrailingStops) return; // Không làm gì nếu chế độ hiển thị TS đang tắt.

    removeTrailingStopVisualization(position.id); // Xóa cái cũ.
    addTrailingStopVisualization(position);      // Thêm cái mới.
  }, [showTrailingStops, addTrailingStopVisualization, removeTrailingStopVisualization]); // Dependencies: hàm sẽ được tạo lại nếu các hàm phụ thuộc thay đổi.

  /**
   * `clearAllTrailingStopVisualizations`
   * Chức năng: Xóa tất cả các đường trực quan hóa Trailing Stop khỏi biểu đồ.
   * `useCallback` để ghi nhớ hàm.
   */
  const clearAllTrailingStopVisualizations = useCallback(() => {
    trailingStopLinesRef.current.forEach((_, positionId) => {
      removeTrailingStopVisualization(positionId); // Lặp qua tất cả và xóa.
    });
  }, [removeTrailingStopVisualization]); // Dependencies: hàm sẽ được tạo lại nếu `removeTrailingStopVisualization` thay đổi.

  // =========================================================================
  // EFFECTS ĐỂ TẢI VÀ CẬP NHẬT VỊ THẾ TRAILING STOP
  // =========================================================================

  /**
   * `useEffect` để tải và hiển thị vị thế Trailing Stop mô phỏng dựa trên dữ liệu thị trường thực.
   * Hàm này mô phỏng việc tạo các vị thế thực tế để hiển thị trên biểu đồ mà không cần đặt lệnh thật.
   */
  useEffect(() => {
    const currentCoinData = coinsData[selectedCoin]; // Lấy dữ liệu của đồng coin đang chọn.
    // Nếu không có dữ liệu hoặc giá bằng 0, không tạo vị thế mô phỏng.
    if (!currentCoinData || currentCoinData.price === 0) {
      setTrailingStopPositions([]); // Xóa các vị thế hiện có.
      return;
    }

    const currentPrice = currentCoinData.price; // Giá hiện tại.
    // const change24h = currentCoinData.change24h; // Phần trăm thay đổi 24h (không dùng trực tiếp ở đây).

    // Tính toán giá vào lệnh (entryPrice) một cách thực tế hơn:
    // Giả lập một biến động nhỏ (±2%) từ giá hiện tại để entryPrice không trùng khớp hoàn toàn.
    const entryPriceVariation = currentPrice * 0.02; // ±2% biến động.
    const entryPrice = currentPrice - entryPriceVariation; // entryPrice thấp hơn một chút.

    // Tính toán giá cao nhất (highestPrice) đã đạt được:
    // Giả định ít nhất 5% trên entryPrice, hoặc giá hiện tại nếu nó cao hơn.
    const highestPrice = Math.max(currentPrice, entryPrice * 1.05);

    // Tính toán giá Stop Loss dựa trên phần trăm trailing (2.5%).
    const trailingPercent = 2.5;
    const stopLossPrice = highestPrice * (1 - trailingPercent / 100);

    // Tính toán PnL (Profit and Loss) và số lượng (quantity) một cách thực tế.
    const unrealizedPnL = (currentPrice - entryPrice) / entryPrice * 100; // PnL phần trăm.
    // Số lượng tùy thuộc vào loại coin (PEPE số lượng lớn, BTC/ETH số lượng nhỏ).
    const quantity = selectedCoin === 'PEPE' ? 1000000 : selectedCoin === 'BTC' ? 0.1 : 2.5;
    const unrealizedPnLUSD = (currentPrice - entryPrice) * quantity; // PnL bằng USD.

    // Tạo một mảng các vị thế Trailing Stop mô phỏng.
    const realMarketPositions: TrailingStopPosition[] = [
      {
        id: 'real_market_1',       // ID duy nhất.
        symbol: selectedCoin + '/USDT', // Cặp tiền tệ.
        side: 'sell',               // Hướng là "sell" (trailing stop loss thường cho vị thế mua).
        quantity: quantity,         // Số lượng.
        entryPrice: entryPrice,     // Giá vào lệnh.
        currentPrice: currentPrice, // Giá hiện tại.
        highestPrice: highestPrice, // Giá cao nhất đạt được (cho trailing stop loss).
        lowestPrice: Math.min(currentPrice, entryPrice), // Giá thấp nhất đạt được (chưa dùng nhiều cho sell).
        strategy: 'percentage',     // Chiến lược phần trăm.
        trailingPercent: trailingPercent, // Phần trăm trailing.
        maxLossPercent: 5,          // Phần trăm lỗ tối đa.
        status: 'active',           // Trạng thái hoạt động.
        stopLossPrice: stopLossPrice, // Giá Stop Loss.
        createdAt: Date.now() - 3600000, // Tạo cách đây 1 giờ.
        activatedAt: Date.now() - 3600000, // Kích hoạt cùng thời điểm tạo.
        unrealizedPnL: unrealizedPnLUSD, // PnL bằng USD.
        unrealizedPnLPercent: unrealizedPnL, // PnL phần trăm.
        maxDrawdown: Math.min(0, unrealizedPnL), // Drawdown tối đa (PnL âm).
        maxProfit: Math.max(0, unrealizedPnL),   // Lợi nhuận tối đa (PnL dương).
        chartData: { // Dữ liệu riêng cho biểu đồ.
          entryPoint: { time: Date.now() - 3600000, price: entryPrice, color: '#3b82f6', label: 'Entry' },
          currentStopLevel: { time: Date.now(), price: stopLossPrice, color: '#ef4444', label: 'Stop' },
          currentPoint: { time: Date.now(), price: currentPrice, color: '#10b981', label: 'Current' },
          stopLossPoint: { time: Date.now(), price: stopLossPrice, color: '#ef4444', label: 'Stop' },
          trailingPath: [], // Đường trailing (được cập nhật bởi TrailingStopOverlay).
          profitZone: { topPrice: highestPrice * 1.1, bottomPrice: currentPrice, color: '#10b981', opacity: 0.1 },
          lossZone: { topPrice: stopLossPrice, bottomPrice: stopLossPrice * 0.95, color: '#ef4444', opacity: 0.1 }
        }
      }
    ];

    // Chỉ cập nhật `trailingStopPositions` nếu giá hiện tại hợp lệ (> 0).
    if (currentPrice > 0) {
      setTrailingStopPositions(realMarketPositions);
    } else {
      setTrailingStopPositions([]);
    }
  }, [selectedCoin, coinsData, setTrailingStopPositions]); // Dependencies: hàm sẽ chạy lại khi các giá trị này thay đổi.

  /**
   * `useEffect` để cập nhật trực quan hóa Trailing Stop trên biểu đồ.
   * Hàm này chạy khi `trailingStopPositions` hoặc `showTrailingStops` thay đổi.
   */
  useEffect(() => {
    if (!chartInstanceRef.current || !priceSeriesRef.current) return; // Đảm bảo biểu đồ đã sẵn sàng.

    clearAllTrailingStopVisualizations(); // Xóa tất cả trực quan hóa hiện có.

    // Nếu `showTrailingStops` là true, thêm lại các trực quan hóa.
    if (showTrailingStops) {
      trailingStopPositions.forEach(position => {
        addTrailingStopVisualization(position); // Thêm trực quan hóa cho từng vị thế.
      });
    }
  }, [trailingStopPositions, showTrailingStops, clearAllTrailingStopVisualizations, addTrailingStopVisualization]); // Dependencies.

  /**
   * `useEffect` (Cleanup Effect)
   * Chức năng: Đảm bảo các đối tượng biểu đồ được gỡ bỏ khi component unmount.
   */
  useEffect(() => {
    return () => {
      clearAllTrailingStopVisualizations(); // Xóa tất cả trực quan hóa khi component bị gỡ bỏ.
    };
  }, [clearAllTrailingStopVisualizations]); // Dependencies.

  // =========================================================================
  // HÀM QUẢN LÝ KHỞI TẠO VÀ CẬP NHẬT BIỂU ĐỒ LIGHTWEIGHT CHARTS
  // =========================================================================

  /**
   * `cleanupChart`
   * Chức năng: Xóa instance biểu đồ và các series dữ liệu để chuẩn bị cho việc tạo lại.
   * `useCallback` để ghi nhớ hàm, tránh tạo lại không cần thiết.
   */
  const cleanupChart = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove(); // Gỡ bỏ biểu đồ.
      chartInstanceRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = ''; // Xóa nội dung trong container DOM.
    }
  }, []);

  /**
   * `useEffect` để TẠO và TÁI TẠO cấu trúc biểu đồ LightWeight Charts.
   * Hàm này chạy khi `selectedCoin`, `chartType`, `showVolume` hoặc `cleanupChart` thay đổi.
   */
  useEffect(() => {
    if (!chartContainerRef.current) return; // Đảm bảo phần tử DOM container tồn tại.

    setChartError(null); // Reset lỗi biểu đồ.
    cleanupChart();      // Dọn dẹp instance cũ trước khi tạo mới.

    try {
      // 1. TẠO BIỂU ĐỒ CHÍNH (`IChartApi`)
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth, // Chiều rộng bằng chiều rộng của container.
        height: height,                               // Chiều cao truyền vào props.
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' }, // Nền trong suốt.
          textColor: '#334155', // Màu chữ.
          fontSize: 12
        },
        grid: {
          vertLines: { color: '#e2e8f0', style: LineStyle.Dotted }, // Đường lưới dọc.
          horzLines: { color: '#e2e8f0', style: LineStyle.Dotted }  // Đường lưới ngang.
        },
        timeScale: {
          borderColor: '#e2e8f0', // Màu viền trục thời gian.
          timeVisible: true,      // Hiển thị thời gian.
          secondsVisible: false,  // Không hiển thị giây.
          rightOffset: 12         // Khoảng cách từ bên phải trục thời gian.
        },
        rightPriceScale: {
          borderColor: '#e2e8f0', // Màu viền trục giá bên phải.
          // FIX LỖI HIỂN THỊ TRỤC GIÁ CHO PEPE:
          // Điều chỉnh `minMove` và `precision` dựa trên `selectedCoin`.
          // Điều này giúp trục giá có đủ độ phân giải cho các giá trị rất nhỏ của PEPE.
          // Ngoài ra, `mode: 2` (Normal) sẽ tự động hiển thị các nhãn giá ở độ chính xác phù hợp.
          // `autoScale` nên là true để tự động điều chỉnh phạm vi nhìn thấy được.
          autoScale: true,
          scaleMargins: {
            top: 0.1,    // 10% margin ở trên.
            bottom: 0.1, // 10% margin ở dưới.
          },
          // Định dạng nhãn giá được xử lý thông qua priceFormat của series thay vì formatter ở đây
          // Điều này tuân theo API chính thức của lightweight-charts
        },
        crosshair: { // Cấu hình đường chữ thập khi di chuột.
          mode: CrosshairMode.Normal,
          vertLine: { width: 1, color: '#758694', style: LineStyle.Dashed },
          horzLine: { width: 1, color: '#758694', style: LineStyle.Dashed },
        },
        handleScroll: { // Tùy chọn xử lý cuộn chuột.
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: { // Tùy chọn xử lý phóng to/thu nhỏ.
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });
      chartInstanceRef.current = chart; // Lưu instance của biểu đồ vào ref.

      // 2. TẠO CHUỖI DỮ LIỆU GIÁ (Candlestick hoặc Line)
      if (chartType === 'candle') {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981', downColor: '#ef4444', // Màu nến tăng/giảm.
          borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444', // Ẩn viền, màu bấc.
          priceLineVisible: true, // Hiển thị đường giá cuối cùng.
          lastValueVisible: true, // Hiển thị giá cuối cùng trên trục giá.
          // Định dạng giá dựa trên loại coin để xử lý các token micro-cap như PEPE
          priceFormat: {
            type: 'price',
            precision: selectedCoin === 'PEPE' ? 8 : selectedCoin === 'BTC' ? 2 : 4,
            minMove: selectedCoin === 'PEPE' ? 0.00000001 : selectedCoin === 'BTC' ? 0.01 : 0.0001,
          },
        });
        priceSeriesRef.current = series; // Lưu tham chiếu đến chuỗi giá.
      } else { // Nếu là biểu đồ đường.
        const series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
          // Định dạng giá dựa trên loại coin để xử lý các token micro-cap như PEPE
          priceFormat: {
            type: 'price',
            precision: selectedCoin === 'PEPE' ? 8 : selectedCoin === 'BTC' ? 2 : 4,
            minMove: selectedCoin === 'PEPE' ? 0.00000001 : selectedCoin === 'BTC' ? 0.01 : 0.0001,
          },
        }); // Màu và độ dày đường.
        priceSeriesRef.current = series;
      }

      // 3. TẠO CHUỖI DỮ LIỆU KHỐI LƯỢNG (Histogram)
      if (showVolume) {
        const volSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' }, // Định dạng giá đặc biệt cho volume.
          priceScaleId: 'volume_scale',   // Gắn vào một trục giá riêng biệt cho volume.
        });
        // Áp dụng tùy chọn cho trục giá của volume (margin).
        chart.priceScale('volume_scale').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
        volumeSeriesRef.current = volSeries; // Lưu tham chiếu đến chuỗi volume.
      }

      // 4. XỬ LÝ SỰ KIỆN CHUỘT (CHO TOOLTIP)
      /**
       * `handleCrosshairMove`
       * Chức năng: Cập nhật dữ liệu tooltip khi người dùng di chuột trên biểu đồ.
       * Tính toán giá OHLC, thay đổi phần trăm, và vị trí tooltip.
       * @param param : MouseEventParams - Tham số sự kiện di chuột từ LightWeight Charts.
       */
      const handleCrosshairMove = (param: MouseEventParams) => {
        if (!param.time || !param.point) { // Nếu không có thời gian hoặc điểm chuột, ẩn tooltip.
          setTooltipData(prev => ({ ...prev, isVisible: false }));
          return;
        }

        // Tìm nến tương ứng với thời gian của crosshair.
        const currentCandle = candleData.find(c => Math.abs((c.time / 1000) - (param.time as number)) < 30);
        if (!currentCandle) { // Nếu không tìm thấy nến, ẩn tooltip.
          setTooltipData(prev => ({ ...prev, isVisible: false }));
          return;
        }

        // Tìm nến trước đó để tính toán thay đổi giá.
        const currentIndex = candleData.findIndex(c => Math.abs((c.time / 1000) - (param.time as number)) < 30);
        const previousCandle = currentIndex > 0 ? candleData[currentIndex - 1] : null;

        // Tính toán thay đổi giá và phần trăm thay đổi của nến.
        const change = previousCandle ? currentCandle.close - previousCandle.close : 0;
        const changePercent = previousCandle ? (change / previousCandle.close) * 100 : 0;

        // Tính toán thay đổi giá và phần trăm thay đổi so với giá trực tiếp hiện tại.
        const currentPrice = coinsData[selectedCoin]?.price || 0;
        const vsCurrentPriceChange = currentPrice - currentCandle.close;
        const vsCurrentPricePercent = currentCandle.close > 0 ? (vsCurrentPriceChange / currentCandle.close) * 100 : 0;

        // Định dạng thời gian cho tooltip.
        const date = new Date((param.time as number) * 1000);
        const timeString = date.toLocaleString('en-US', {
          month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        });

        // Cập nhật trạng thái `tooltipData`.
        setTooltipData({
          time: timeString,
          open: currentCandle.open, high: currentCandle.high, low: currentCandle.low, close: currentCandle.close,
          volume: currentCandle.volume, change, changePercent, currentPrice,
          vsCurrentPriceChange, vsCurrentPricePercent,
          isVisible: true, x: param.point.x, y: param.point.y,
        });
      };

      chart.subscribeCrosshairMove(handleCrosshairMove); // Đăng ký sự kiện di chuyển crosshair.

      // 5. XỬ LÝ THAY ĐỔI KÍCH THƯỚC CỬA SỔ
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.resize(chartContainerRef.current.clientWidth, height); // Thay đổi kích thước biểu đồ khi cửa sổ thay đổi.
        }
      };

      window.addEventListener('resize', handleResize); // Đăng ký sự kiện resize.

      // Hàm cleanup của `useEffect`: chạy khi component unmount hoặc dependencies thay đổi.
      return () => {
        chart.unsubscribeCrosshairMove(handleCrosshairMove); // Hủy đăng ký sự kiện.
        window.removeEventListener('resize', handleResize);  // Hủy đăng ký sự kiện resize.
        cleanupChart(); // Dọn dẹp biểu đồ.
      };
    } catch (error) {
      console.error("Chart initialization failed:", error); // Log lỗi nếu khởi tạo biểu đồ thất bại.
      setChartError("Failed to load advanced chart. Please try refreshing."); // Đặt thông báo lỗi.
    }
  }, [selectedCoin, chartType, showVolume, height, cleanupChart]); // Dependencies: hàm sẽ chạy lại khi các giá trị này thay đổi.

  /**
   * `useEffect` để CẬP NHẬT DỮ LIỆU vào biểu đồ.
   * Hàm này chạy khi `candleData`, `isLoading`, `chartType`, `showVolume` hoặc `selectedCoin` thay đổi.
   */
  useEffect(() => {
    // Không cập nhật nếu instance biểu đồ hoặc chuỗi giá chưa sẵn sàng.
    if (!chartInstanceRef.current || !priceSeriesRef.current) {
      return;
    }

    // Không cập nhật nếu đang trong trạng thái tải ban đầu (chưa có dữ liệu).
    if (isLoading) {
      return;
    }

    try {
      const formattedCandleData = candleData.map(c => ({
        time: (c.time / 1000) as Time, // Chuyển đổi timestamp sang định dạng của Lightweight Charts.
        open: c.open, high: c.high, low: c.low, close: c.close,
      }));

      // Cập nhật dữ liệu cho chuỗi giá (nến hoặc đường).
      if (chartType === 'candle') {
        (priceSeriesRef.current as ISeriesApi<'Candlestick'>).setData(formattedCandleData);
      } else {
        (priceSeriesRef.current as ISeriesApi<'Line'>).setData(
          formattedCandleData.map(d => ({ time: d.time, value: d.close })) // Chỉ dùng giá đóng cửa cho biểu đồ đường.
        );
      }

      // Cập nhật dữ liệu cho chuỗi khối lượng nếu `showVolume` là true.
      if (showVolume && volumeSeriesRef.current) {
        const volumeData: HistogramData[] = candleData.map(c => ({
          time: (c.time / 1000) as Time, value: c.volume,
          // Màu của cột volume tùy thuộc vào nến tăng/giảm.
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Chỉ gọi `fitContent()` để tự động điều chỉnh phạm vi hiển thị nếu có dữ liệu.
      if (candleData.length > 0) {
        chartInstanceRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error updating chart data:', error); // Log lỗi nếu cập nhật dữ liệu thất bại.
      setChartError('Failed to update chart data');      // Đặt thông báo lỗi.
    }
  }, [candleData, isLoading, chartType, showVolume, selectedCoin]); // Dependencies.

  // =========================================================================
  // EFFECTS KHÁC - DỊCH VỤ TRAILING STOP VÀ LẤY VỊ THẾ
  // =========================================================================

  /**
   * `useEffect` để khởi tạo `EnhancedTrailingStopService`.
   * Dịch vụ này quản lý logic phức tạp cho các vị thế Trailing Stop nâng cao.
   */
  useEffect(() => {
    // Định nghĩa cài đặt mặc định cho dịch vụ.
    const defaultSettings: TrailingStopSettings = {
      defaultStrategy: 'percentage', defaultTrailingPercent: 2.5, defaultMaxLoss: 5, maxLossPercent: 5,
      atrPeriod: 14, atrMultiplier: 2, volatilityLookback: 20, volatilityMultiplier: 0.5,
      maxPositions: 10, maxRiskPerPosition: 2, updateInterval: 5000, priceChangeThreshold: 0.1,
      fibonacciSettings: { levels: [0.236, 0.382, 0.5, 0.618, 0.786], lookbackPeriod: 50, defaultLevel: 0.618 },
      bollingerSettings: { period: 20, stdDev: 2, useUpperBand: true, useLowerBand: true },
      volumeProfileSettings: { period: 100, valueAreaPercent: 70, pocSensitivity: 0.1 },
      smartMoneySettings: { structureTimeframe: '1h', liquidityLevels: 3, orderBlockPeriod: 20 },
      ichimokuSettings: { tenkanSen: 9, kijunSen: 26, senkouSpanB: 52, displacement: 26 },
      pivotSettings: { type: 'standard', period: 'daily', levels: 3 }
    };

    const trailingService = new EnhancedTrailingStopService(defaultSettings); // Tạo instance dịch vụ.
    setEnhancedService(trailingService); // Lưu instance vào state.
  }, []); // Hàm này chỉ chạy một lần khi component mount.

  /**
   * `useEffect` để tải các vị thế Trailing Stop nâng cao từ dịch vụ.
   * Hàm này cũng lọc các vị thế cho đồng coin hiện tại và cập nhật định kỳ.
   */
  useEffect(() => {
    if (!enhancedService) return; // Đảm bảo dịch vụ đã được khởi tạo.

    const loadEnhancedPositions = async () => {
      try {
        const positions = await enhancedService.getActivePositions(); // Lấy tất cả vị thế đang hoạt động.
        // Lọc các vị thế liên quan đến đồng coin đang chọn.
        const symbolPositions = positions.filter(pos =>
          pos.symbol.replace('/', '') === selectedCoin.replace('/', '')
        );
        // Sử dụng `externalPositions` nếu được cung cấp (từ props),
        // nếu không, sử dụng các vị thế từ dịch vụ đã lọc.
        const finalPositions = externalPositions || symbolPositions;
        setEnhancedPositions(finalPositions); // Cập nhật trạng thái vị thế nâng cao.
      } catch (error) {
        console.error('Error loading enhanced positions:', error);
        setEnhancedPositions([]); // Xóa vị thế nếu có lỗi.
      }
    };

    loadEnhancedPositions(); // Tải lần đầu.

    // Thiết lập interval để tự động tải lại mỗi 5 giây.
    const interval = setInterval(loadEnhancedPositions, 5000);

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount.
  }, [enhancedService, selectedCoin, externalPositions]); // Dependencies: hàm chạy lại khi các giá trị này thay đổi.

  /**
   * `useEffect` để tải các vị thế Trailing Stop đang hoạt động (dữ liệu legacy).
   * Hàm này lấy dữ liệu từ API `/api/active-simulations` để hiển thị trên biểu đồ.
   */
  useEffect(() => {
    const loadActiveTrailingStops = async () => {
      try {
        const stops = await getActiveTrailingStops(); // Lấy dữ liệu từ API.
        setActiveTrailingStops(stops); // Cập nhật trạng thái.
      } catch (error) {
        console.error('Error loading active trailing stops:', error);
        setActiveTrailingStops([]); // Xóa vị thế nếu có lỗi.
      }
    };

    loadActiveTrailingStops(); // Tải lần đầu.

    // Thiết lập interval để tự động tải lại mỗi 5 giây.
    const interval = setInterval(loadActiveTrailingStops, 5000);

    return () => clearInterval(interval); // Dọn dẹp interval.
  }, []); // Hàm này chỉ chạy một lần khi component mount.

  // =========================================================================
  // XỬ LÝ LỖI VÀ HIỂN THỊ SKELETON
  // =========================================================================

  // Nếu có lỗi biểu đồ, hiển thị thông báo lỗi.
  if (chartError) {
    return <div className="notification notification-error">{chartError}</div>;
  }

  // Hiển thị skeleton (hiệu ứng tải) trong quá trình tải dữ liệu ban đầu.
  // Điều kiện: đang tải (`isLoading` là true) VÀ chưa có dữ liệu nến (`candleData` rỗng).
  if (isLoading && candleData.length === 0) {
    return <ChartSkeleton />; // Render component skeleton.
  }

  // =========================================================================
  // RENDER COMPONENT
  // =========================================================================

  return (
    <div className="relative">
      {/* Timeframe Selector - được định vị tuyệt đối ở góc trên bên trái */}
      <div
        className="absolute top-2 left-2"
        style={{ zIndex: 1001, pointerEvents: 'auto' }} // Đảm bảo các nút tương tác được và nằm trên biểu đồ.
      >
        <InlineTimeframeSelector
          value={timeframe}     // Khung thời gian hiện tại.
          onChange={setTimeframe} // Hàm thay đổi khung thời gian.
        />
      </div>

      {/* Các nút điều khiển biểu đồ - được định vị tuyệt đối dưới selector khung thời gian */}
      {/* `showControls` prop có thể dùng để ẩn/hiện toàn bộ phần này */}
      {showControls && (
        <div
          className="absolute top-14 left-2 flex items-center gap-2"
          style={{ zIndex: 1000, pointerEvents: 'auto' }}
        >
          {/* Nút chuyển sang biểu đồ Nến */}
          <button
            onClick={() => setChartType('candle')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              chartType === 'candle' // Đổi màu nếu đây là loại biểu đồ đang được chọn.
                ? 'bg-accent text-white'
                : 'bg-secondary-bg text-foreground border border-border hover:border-accent hover:text-accent'
            }`}
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}
            title="Chuyển sang biểu đồ nến"
          >
            📊 Nến
          </button>
          {/* Nút chuyển sang biểu đồ Đường */}
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              chartType === 'line'
                ? 'bg-accent text-white'
                : 'bg-secondary-bg text-foreground border border-border hover:border-accent hover:text-accent'
            }`}
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}
            title="Chuyển sang biểu đồ đường"
          >
            📈 Đường
          </button>
          {/* Nút bật/tắt hiển thị Khối lượng */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              showVolume
                ? 'bg-accent text-white'
                : 'bg-secondary-bg text-foreground border border-border hover:border-accent hover:text-accent'
            }`}
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}
            title={`${showVolume ? 'Ẩn' : 'Hiện'} chỉ báo khối lượng`}
          >
            📊 {t.trading.volume}
          </button>
          {/* Nút bật/tắt hiển thị Trailing Stops */}
          <button
            onClick={() => setShowTrailingStops(!showTrailingStops)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              showTrailingStops
                ? 'bg-accent text-white'
                : 'bg-secondary-bg text-foreground border border-border hover:border-accent hover:text-accent'
            }`}
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}
            title={`${showTrailingStops ? 'Ẩn' : 'Hiện'} trailing stops`}
          >
            🎯 Stops
          </button>
        </div>
      )}


      {/* Vùng chứa biểu đồ LightWeight Charts và LoadingOverlay */}
      {/* `LoadingOverlay` sẽ hiển thị hiệu ứng tải nếu `isLoading` là true */}
      <LoadingOverlay isLoading={isLoading} message="Loading chart data...">
        <div className="relative">
          <div
            ref={chartContainerRef} // Tham chiếu đến phần tử DOM sẽ chứa biểu đồ.
            // `transition-opacity duration-300`: Hiệu ứng chuyển đổi mượt mà khi `isLoading` thay đổi.
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ height: `${height}px`, width: '100%' }} // Đặt chiều cao và chiều rộng của container.
          />

          {/* Các Overlay cho Trailing Stop và Chỉ báo Chiến lược */}
          {/* Chỉ hiển thị nếu `showTrailingStops` là true và biểu đồ đã được khởi tạo */}
          {showTrailingStops && chartInstanceRef.current && (
            <>
              {/* `TrailingStopOverlay`: Hiển thị các đường entry, stop, profit, và trailing path */}
              <TrailingStopOverlay
                chart={chartInstanceRef.current} // Instance của biểu đồ.
                trailingStops={activeTrailingStops} // Dữ liệu Trailing Stop từ API (legacy).
                positions={enhancedPositions} // Vị thế nâng cao (cho chỉ báo chiến lược).
                symbol={selectedCoin} // Đồng coin đang chọn.
                currentPrice={coinsData[selectedCoin]?.price || 0} // Giá hiện tại của coin.
                showStrategyIndicators={true} // Bật hiển thị chỉ báo chiến lược.
                candleData={candleData} // Dữ liệu nến để tính toán chỉ báo.
              />
              {/* `TrailingStopLegend`: Legend giải thích các đường Trailing Stop. */}
              <TrailingStopLegend
                trailingStops={activeTrailingStops}
                symbol={selectedCoin}
                currentPrice={coinsData[selectedCoin]?.price || 0}
              />

              {/* `StrategyIndicatorLegend`: Legend giải thích các chỉ báo chiến lược. */}
              {/* Chỉ hiển thị nếu có vị thế nâng cao. */}
              {enhancedPositions.length > 0 && (
                <StrategyIndicatorLegend
                  positions={enhancedPositions}
                  symbol={selectedCoin}
                  currentPrice={coinsData[selectedCoin]?.price || 0}
                />
              )}
            </>
          )}
        </div>
      </LoadingOverlay>

      {/* Tooltip nâng cao theo phong cách Binance */}
      {/* Chỉ hiển thị nếu `tooltipData.isVisible` là true */}
      {tooltipData.isVisible && (
        <div
          className="absolute pointer-events-none z-50 transition-all duration-200 ease-out animate-in fade-in-0 zoom-in-95"
          style={{
            // Tính toán vị trí X của tooltip để nó không bị tràn ra ngoài màn hình.
            left: Math.min(tooltipData.x + 15, (chartContainerRef.current?.clientWidth || 400) - 280),
            // Tính toán vị trí Y của tooltip.
            top: Math.max(tooltipData.y - 10, 10),
            // Di chuyển tooltip sang trái nếu nó gần cạnh phải màn hình để không bị ẩn.
            transform: tooltipData.x > (chartContainerRef.current?.clientWidth || 400) - 300 ? 'translateX(-100%)' : 'none',
          }}
        >
          {/* Nội dung của tooltip */}
          <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 p-4 min-w-[260px] backdrop-blur-sm bg-opacity-95">
            {/* Header với thời gian và symbol */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm font-semibold">{selectedCoin}/USDT</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300 text-sm font-medium">{tooltipData.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Icon và phần trăm thay đổi của nến (xanh/đỏ) */}
                <div className={`w-2 h-2 rounded-full ${tooltipData.change >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-semibold ${tooltipData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tooltipData.change >= 0 ? '+' : ''}{tooltipData.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* So sánh với giá hiện tại */}
            <div className="mb-3 p-2 rounded-md bg-gray-800 border border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 text-sm font-medium">{t.trading.priceChange}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${tooltipData.vsCurrentPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tooltipData.vsCurrentPriceChange >= 0 ? '+' : ''}{tooltipData.vsCurrentPricePercent.toFixed(2)}%
                  </span>
                  <span className="text-gray-400 text-xs">
                    {t.trading.vsCurrentPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Dữ liệu OHLC (Open, High, Low, Close) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.open}</span>
                  <span className="text-white font-mono text-sm">${formatChartPrice(tooltipData.open)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.high}</span>
                  <span className="text-green-400 font-mono text-sm font-semibold">${formatChartPrice(tooltipData.high)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.low}</span>
                  <span className="text-red-400 font-mono text-sm font-semibold">${formatChartPrice(tooltipData.low)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.close}</span>
                  <span className={`font-mono text-sm font-semibold ${tooltipData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${formatChartPrice(tooltipData.close)}
                  </span>
                </div>
              </div>
            </div>

            {/* Khối lượng và Thay đổi */}
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.volume}</span>
                <span className="text-blue-400 font-mono text-sm">
                  {formatChartVolume(tooltipData.volume)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.change}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm ${tooltipData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tooltipData.change >= 0 ? '+' : ''}${formatChartPrice(Math.abs(tooltipData.change))}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tooltipData.change >= 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {tooltipData.change >= 0 ? '+' : ''}{tooltipData.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* So sánh giá hiện tại */}
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.currentPrice}</span>
                <span className="text-yellow-400 font-mono text-sm font-semibold">
                  ${formatChartPrice(tooltipData.currentPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wide">{t.trading.vsCurrentPrice}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-semibold ${tooltipData.vsCurrentPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tooltipData.vsCurrentPriceChange >= 0 ? '+' : ''}${formatChartPrice(Math.abs(tooltipData.vsCurrentPriceChange))}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${tooltipData.vsCurrentPriceChange >= 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {tooltipData.vsCurrentPriceChange >= 0 ? '+' : ''}{tooltipData.vsCurrentPricePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Mũi tên của tooltip */}
            <div
              className="absolute w-3 h-3 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"
              style={{
                left: tooltipData.x > (chartContainerRef.current?.clientWidth || 400) - 300 ? 'calc(100% - 20px)' : '10px',
                top: '-6px',
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}