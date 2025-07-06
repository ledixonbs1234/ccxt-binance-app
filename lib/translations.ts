// File: lib/translations.ts
// Translation system for Vietnamese localization

export type Language = 'en' | 'vi';

export interface Translations {
  // Navigation & Layout
  navigation: {
    dashboard: string;
    manualTrade: string;
    smartTrailing: string;
    enhancedDemo: string;
    history: string;
    settings: string;
  };
  
  // Common UI Elements
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    clear: string;
    refresh: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
    copy: string;
    paste: string;
    cut: string;
    undo: string;
    redo: string;
    selectAll: string;
    deselectAll: string;
    active: string;
    inactive: string;
    online: string;
    offline: string;
    connected: string;
    disconnected: string;
    processing: string;
    completed: string;
    failed: string;
    pending: string;
    new: string;
    updated: string;
    deleted: string;
  };

  // Trading Interface
  trading: {
    pair: string;
    price: string;
    volume: string;
    change: string;
    currentPrice: string;
    priceChange: string;
    vsCurrentPrice: string;
    selectCoin: string;
    selectedCoin: string;
    enhancedTrailingStops: string;
    advancedTrailingStopVisualization: string;
    priceChartWithTrailingStops: string;
    activePositionsVisualized: string;
    enhancedFeatures: string;
    visualChartIntegration: string;
    visualChartIntegrationDesc: string;
    multipleStrategies: string;
    multipleStrategiesDesc: string;
    realTimeAlerts: string;
    realTimeAlertsDesc: string;
    riskManagement: string;
    riskManagementDesc: string;
    performanceTracking: string;
    performanceTrackingDesc: string;
    advancedAnalytics: string;
    advancedAnalyticsDesc: string;
    serviceControls: string;
    startService: string;
    stopService: string;
    createNewPosition: string;
    showSettings: string;
    hideSettings: string;
    serviceRunning: string;
    serviceStopped: string;
    high: string;
    low: string;
    open: string;
    close: string;
    buy: string;
    sell: string;
    amount: string;
    total: string;
    balance: string;
    available: string;
    locked: string;
    fee: string;
    orderType: string;
    market: string;
    limit: string;
    stopLoss: string;
    takeProfit: string;
    trailingStop: string;
    orderBook: string;
    recentTrades: string;
    myOrders: string;
    orderHistory: string;
    tradingPair: string;
    priceChart: string;
    realTimeAnalysis: string;
    switchToAdvancedChart: string;
    switchToSimpleChart: string;
    candlestickChart: string;
    lineChart: string;
    showVolume: string;
    hideVolume: string;
    showTrailingStops: string;
    hideTrailingStops: string;
    timeframe: string;
    timeframes: {
      '1m': string;
      '5m': string;
      '15m': string;
      '1h': string;
      '4h': string;
      '1d': string;
    };
    indicators: string;
    technicalAnalysis: string;
  };

  // Smart Trailing System
  smartTrailing: {
    title: string;
    subtitle: string;
    service: string;
    aiPowered: string;
    opportunityDetection: string;
    automatedPositionManagement: string;
    marketAnalysis: string;
    realTimeCoinEvaluation: string;
    notifications: string;
    latestServiceActivity: string;
    noRecentActivity: string;
    startService: string;
    stopService: string;
    settings: string;
    configuration: string;
    riskManagement: string;
    profitTargets: string;
    stopLossSettings: string;
    trailingPercentage: string;
    minimumProfit: string;
    maximumLoss: string;
    positionSize: string;
    autoTrade: string;
    manualApproval: string;
    enableNotifications: string;
    emailAlerts: string;
    pushNotifications: string;
    soundAlerts: string;
  };

  // Enhanced Demo
  enhancedDemo: {
    title: string;
    subtitle: string;
    description: string;
    features: string;
    backToMainApp: string;
    demoMode: string;
    realTimeData: string;
    interactiveChart: string;
    advancedTooltips: string;
    trailingStopVisualization: string;
    positionManagement: string;
    riskAnalysis: string;
    performanceMetrics: string;
    alertSystem: string;
  };

  // Status & Messages
  status: {
    binanceTestnet: string;
    connected: string;
    disconnected: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    noData: string;
    dataLoaded: string;
    updating: string;
    syncing: string;
    synchronized: string;
    failed: string;
    retry: string;
    timeout: string;
    networkError: string;
    serverError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    tooManyRequests: string;
    internalError: string;
  };

  // Tooltips & Help
  tooltips: {
    hover: string;
    click: string;
    doubleClick: string;
    rightClick: string;
    drag: string;
    drop: string;
    scroll: string;
    zoom: string;
    pan: string;
    select: string;
    multiSelect: string;
    contextMenu: string;
    keyboard: string;
    mouse: string;
    touch: string;
    gesture: string;
  };

  // Time & Date
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    nextWeek: string;
    thisMonth: string;
    lastMonth: string;
    nextMonth: string;
    thisYear: string;
    lastYear: string;
    nextYear: string;
    seconds: string;
    minutes: string;
    hours: string;
    days: string;
    weeks: string;
    months: string;
    years: string;
    ago: string;
    from: string;
    to: string;
    until: string;
    since: string;
    before: string;
    after: string;
    during: string;
    between: string;
  };

  // Numbers & Formatting
  formatting: {
    currency: string;
    percentage: string;
    decimal: string;
    integer: string;
    scientific: string;
    compact: string;
    thousand: string;
    million: string;
    billion: string;
    trillion: string;
    positive: string;
    negative: string;
    zero: string;
    infinity: string;
    notANumber: string;
  };
}

// English translations (default)
export const enTranslations: Translations = {
  navigation: {
    dashboard: 'Dashboard',
    manualTrade: 'Manual Trade',
    smartTrailing: 'Smart Trailing',
    enhancedDemo: 'Enhanced Demo',
    history: 'History',
    settings: 'Settings',
  },
  
  common: {
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    clear: 'Clear',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    active: 'Active',
    inactive: 'Inactive',
    online: 'Online',
    offline: 'Offline',
    connected: 'Connected',
    disconnected: 'Disconnected',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending',
    new: 'New',
    updated: 'Updated',
    deleted: 'Deleted',
  },

  trading: {
    pair: 'Pair',
    price: 'Price',
    volume: 'Volume',
    change: 'Change',
    currentPrice: 'Current Price',
    priceChange: 'Price Change',
    vsCurrentPrice: 'vs Current Price',
    selectCoin: 'Select Cryptocurrency',
    selectedCoin: 'Selected Coin',
    enhancedTrailingStops: 'Enhanced Trailing Stops',
    advancedTrailingStopVisualization: 'Advanced trailing stop visualization and management',
    priceChartWithTrailingStops: 'Price Chart with Trailing Stops',
    activePositionsVisualized: 'active positions visualized',
    enhancedFeatures: 'Enhanced Features',
    visualChartIntegration: 'Visual Chart Integration',
    visualChartIntegrationDesc: 'Entry points, stop levels, and profit zones displayed directly on the chart',
    multipleStrategies: 'Multiple Strategies',
    multipleStrategiesDesc: 'Percentage, ATR, and dynamic trailing stop strategies',
    realTimeAlerts: 'Real-time Alerts',
    realTimeAlertsDesc: 'Instant notifications for position adjustments and trigger events',
    riskManagement: 'Risk Management',
    riskManagementDesc: 'Advanced position sizing and maximum loss protection',
    performanceTracking: 'Performance Tracking',
    performanceTrackingDesc: 'Comprehensive analytics and performance metrics',
    advancedAnalytics: 'Advanced Analytics',
    advancedAnalyticsDesc: 'Market analysis and optimization recommendations',
    serviceControls: 'Service Controls',
    startService: 'Start Service',
    stopService: 'Stop Service',
    createNewPosition: 'Create New Position',
    showSettings: 'Show Settings',
    hideSettings: 'Hide Settings',
    serviceRunning: 'Service Running',
    serviceStopped: 'Service Stopped',
    high: 'High',
    low: 'Low',
    open: 'Open',
    close: 'Close',
    buy: 'Buy',
    sell: 'Sell',
    amount: 'Amount',
    total: 'Total',
    balance: 'Balance',
    available: 'Available',
    locked: 'Locked',
    fee: 'Fee',
    orderType: 'Order Type',
    market: 'Market',
    limit: 'Limit',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    trailingStop: 'Trailing Stop',
    orderBook: 'Order Book',
    recentTrades: 'Recent Trades',
    myOrders: 'My Orders',
    orderHistory: 'Order History',
    tradingPair: 'Trading Pair',
    priceChart: 'Price Chart',
    realTimeAnalysis: 'Real-time analysis',
    switchToAdvancedChart: 'Switch to Advanced Chart',
    switchToSimpleChart: 'Switch to Simple Chart',
    candlestickChart: 'Candlestick Chart',
    lineChart: 'Line Chart',
    showVolume: 'Show Volume',
    hideVolume: 'Hide Volume',
    showTrailingStops: 'Show Trailing Stops',
    hideTrailingStops: 'Hide Trailing Stops',
    timeframe: 'Timeframe',
    timeframes: {
      '1m': '1 Minute',
      '5m': '5 Minutes',
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '4h': '4 Hours',
      '1d': '1 Day',
    },
    indicators: 'Indicators',
    technicalAnalysis: 'Technical Analysis',
  },

  smartTrailing: {
    title: 'Smart Trailing Service',
    subtitle: 'AI-powered opportunity detection and automated position management',
    service: 'Service',
    aiPowered: 'AI-powered',
    opportunityDetection: 'Opportunity Detection',
    automatedPositionManagement: 'Automated Position Management',
    marketAnalysis: 'Market Analysis',
    realTimeCoinEvaluation: 'Real-time coin evaluation',
    notifications: 'Notifications',
    latestServiceActivity: 'Latest service activity',
    noRecentActivity: 'No recent activity',
    startService: 'Start Service',
    stopService: 'Stop Service',
    settings: 'Settings',
    configuration: 'Configuration',
    riskManagement: 'Risk Management',
    profitTargets: 'Profit Targets',
    stopLossSettings: 'Stop Loss Settings',
    trailingPercentage: 'Trailing Percentage',
    minimumProfit: 'Minimum Profit',
    maximumLoss: 'Maximum Loss',
    positionSize: 'Position Size',
    autoTrade: 'Auto Trade',
    manualApproval: 'Manual Approval',
    enableNotifications: 'Enable Notifications',
    emailAlerts: 'Email Alerts',
    pushNotifications: 'Push Notifications',
    soundAlerts: 'Sound Alerts',
  },

  enhancedDemo: {
    title: 'Enhanced Trailing Stop Demo',
    subtitle: 'Advanced trading features demonstration',
    description: 'Experience professional trading tools with real-time data',
    features: 'Features',
    backToMainApp: 'Back to Main App',
    demoMode: 'Demo Mode',
    realTimeData: 'Real-time Data',
    interactiveChart: 'Interactive Chart',
    advancedTooltips: 'Advanced Tooltips',
    trailingStopVisualization: 'Trailing Stop Visualization',
    positionManagement: 'Position Management',
    riskAnalysis: 'Risk Analysis',
    performanceMetrics: 'Performance Metrics',
    alertSystem: 'Alert System',
  },

  status: {
    binanceTestnet: 'Binance Testnet',
    connected: 'Connected',
    disconnected: 'Disconnected',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    noData: 'No Data',
    dataLoaded: 'Data Loaded',
    updating: 'Updating',
    syncing: 'Syncing',
    synchronized: 'Synchronized',
    failed: 'Failed',
    retry: 'Retry',
    timeout: 'Timeout',
    networkError: 'Network Error',
    serverError: 'Server Error',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    notFound: 'Not Found',
    conflict: 'Conflict',
    tooManyRequests: 'Too Many Requests',
    internalError: 'Internal Error',
  },

  tooltips: {
    hover: 'Hover to see details',
    click: 'Click to interact',
    doubleClick: 'Double-click to edit',
    rightClick: 'Right-click for options',
    drag: 'Drag to move',
    drop: 'Drop to place',
    scroll: 'Scroll to navigate',
    zoom: 'Zoom to scale',
    pan: 'Pan to move view',
    select: 'Select item',
    multiSelect: 'Multi-select items',
    contextMenu: 'Context menu',
    keyboard: 'Keyboard shortcut',
    mouse: 'Mouse action',
    touch: 'Touch gesture',
    gesture: 'Gesture control',
  },

  time: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    nextMonth: 'Next Month',
    thisYear: 'This Year',
    lastYear: 'Last Year',
    nextYear: 'Next Year',
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
    ago: 'ago',
    from: 'from',
    to: 'to',
    until: 'until',
    since: 'since',
    before: 'before',
    after: 'after',
    during: 'during',
    between: 'between',
  },

  formatting: {
    currency: 'Currency',
    percentage: 'Percentage',
    decimal: 'Decimal',
    integer: 'Integer',
    scientific: 'Scientific',
    compact: 'Compact',
    thousand: 'K',
    million: 'M',
    billion: 'B',
    trillion: 'T',
    positive: 'Positive',
    negative: 'Negative',
    zero: 'Zero',
    infinity: 'Infinity',
    notANumber: 'Not a Number',
  },
};

// Vietnamese translations
export const viTranslations: Translations = {
  navigation: {
    dashboard: 'Bảng điều khiển',
    manualTrade: 'Giao dịch thủ công',
    smartTrailing: 'Trailing thông minh',
    enhancedDemo: 'Demo nâng cao',
    history: 'Lịch sử',
    settings: 'Cài đặt',
  },

  common: {
    loading: 'Đang tải',
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    close: 'Đóng',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước đó',
    clear: 'Xóa',
    refresh: 'Làm mới',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    export: 'Xuất',
    import: 'Nhập',
    copy: 'Sao chép',
    paste: 'Dán',
    cut: 'Cắt',
    undo: 'Hoàn tác',
    redo: 'Làm lại',
    selectAll: 'Chọn tất cả',
    deselectAll: 'Bỏ chọn tất cả',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    online: 'Trực tuyến',
    offline: 'Ngoại tuyến',
    connected: 'Đã kết nối',
    disconnected: 'Mất kết nối',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    failed: 'Thất bại',
    pending: 'Đang chờ',
    new: 'Mới',
    updated: 'Đã cập nhật',
    deleted: 'Đã xóa',
  },

  trading: {
    pair: 'Cặp',
    price: 'Giá',
    volume: 'Khối lượng',
    change: 'Thay đổi',
    currentPrice: 'Giá hiện tại',
    priceChange: 'Thay đổi giá',
    vsCurrentPrice: 'so với giá hiện tại',
    selectCoin: 'Chọn tiền điện tử',
    selectedCoin: 'Coin đã chọn',
    enhancedTrailingStops: 'Trailing Stop Nâng Cao',
    advancedTrailingStopVisualization: 'Trực quan hóa và quản lý trailing stop nâng cao',
    priceChartWithTrailingStops: 'Biểu Đồ Giá với Trailing Stop',
    activePositionsVisualized: 'vị thế đang hoạt động được hiển thị',
    enhancedFeatures: 'Tính Năng Nâng Cao',
    visualChartIntegration: 'Tích Hợp Biểu Đồ Trực Quan',
    visualChartIntegrationDesc: 'Điểm vào, mức stop và vùng lợi nhuận hiển thị trực tiếp trên biểu đồ',
    multipleStrategies: 'Nhiều Chiến Lược',
    multipleStrategiesDesc: 'Chiến lược trailing stop theo phần trăm, ATR và động',
    realTimeAlerts: 'Cảnh Báo Thời Gian Thực',
    realTimeAlertsDesc: 'Thông báo tức thì cho điều chỉnh vị thế và sự kiện kích hoạt',
    riskManagement: 'Quản Lý Rủi Ro',
    riskManagementDesc: 'Định cỡ vị thế nâng cao và bảo vệ tổn thất tối đa',
    performanceTracking: 'Theo Dõi Hiệu Suất',
    performanceTrackingDesc: 'Phân tích toàn diện và chỉ số hiệu suất',
    advancedAnalytics: 'Phân Tích Nâng Cao',
    advancedAnalyticsDesc: 'Phân tích thị trường và khuyến nghị tối ưu hóa',
    serviceControls: 'Điều Khiển Dịch Vụ',
    startService: 'Khởi Động Dịch Vụ',
    stopService: 'Dừng Dịch Vụ',
    createNewPosition: 'Tạo Vị Thế Mới',
    showSettings: 'Hiển Thị Cài Đặt',
    hideSettings: 'Ẩn Cài Đặt',
    serviceRunning: 'Dịch Vụ Đang Chạy',
    serviceStopped: 'Dịch Vụ Đã Dừng',
    high: 'Cao nhất',
    low: 'Thấp nhất',
    open: 'Mở cửa',
    close: 'Đóng cửa',
    buy: 'Mua',
    sell: 'Bán',
    amount: 'Số lượng',
    total: 'Tổng',
    balance: 'Số dư',
    available: 'Khả dụng',
    locked: 'Bị khóa',
    fee: 'Phí',
    orderType: 'Loại lệnh',
    market: 'Thị trường',
    limit: 'Giới hạn',
    stopLoss: 'Cắt lỗ',
    takeProfit: 'Chốt lời',
    trailingStop: 'Trailing Stop',
    orderBook: 'Sổ lệnh',
    recentTrades: 'Giao dịch gần đây',
    myOrders: 'Lệnh của tôi',
    orderHistory: 'Lịch sử lệnh',
    tradingPair: 'Cặp giao dịch',
    priceChart: 'Biểu đồ giá',
    realTimeAnalysis: 'Phân tích thời gian thực',
    switchToAdvancedChart: 'Chuyển sang biểu đồ nâng cao',
    switchToSimpleChart: 'Chuyển sang biểu đồ đơn giản',
    candlestickChart: 'Biểu đồ nến',
    lineChart: 'Biểu đồ đường',
    showVolume: 'Hiển thị khối lượng',
    hideVolume: 'Ẩn khối lượng',
    showTrailingStops: 'Hiển thị Trailing Stop',
    hideTrailingStops: 'Ẩn Trailing Stop',
    timeframe: 'Khung thời gian',
    timeframes: {
      '1m': '1 Phút',
      '5m': '5 Phút',
      '15m': '15 Phút',
      '1h': '1 Giờ',
      '4h': '4 Giờ',
      '1d': '1 Ngày',
    },
    indicators: 'Chỉ báo',
    technicalAnalysis: 'Phân tích kỹ thuật',
  },

  smartTrailing: {
    title: 'Dịch vụ Trailing thông minh',
    subtitle: 'Phát hiện cơ hội bằng AI và quản lý vị thế tự động',
    service: 'Dịch vụ',
    aiPowered: 'Hỗ trợ AI',
    opportunityDetection: 'Phát hiện cơ hội',
    automatedPositionManagement: 'Quản lý vị thế tự động',
    marketAnalysis: 'Phân tích thị trường',
    realTimeCoinEvaluation: 'Đánh giá coin thời gian thực',
    notifications: 'Thông báo',
    latestServiceActivity: 'Hoạt động dịch vụ mới nhất',
    noRecentActivity: 'Không có hoạt động gần đây',
    startService: 'Khởi động dịch vụ',
    stopService: 'Dừng dịch vụ',
    settings: 'Cài đặt',
    configuration: 'Cấu hình',
    riskManagement: 'Quản lý rủi ro',
    profitTargets: 'Mục tiêu lợi nhuận',
    stopLossSettings: 'Cài đặt cắt lỗ',
    trailingPercentage: 'Phần trăm trailing',
    minimumProfit: 'Lợi nhuận tối thiểu',
    maximumLoss: 'Lỗ tối đa',
    positionSize: 'Kích thước vị thế',
    autoTrade: 'Giao dịch tự động',
    manualApproval: 'Phê duyệt thủ công',
    enableNotifications: 'Bật thông báo',
    emailAlerts: 'Cảnh báo email',
    pushNotifications: 'Thông báo đẩy',
    soundAlerts: 'Cảnh báo âm thanh',
  },

  enhancedDemo: {
    title: 'Demo Trailing Stop nâng cao',
    subtitle: 'Trình diễn tính năng giao dịch nâng cao',
    description: 'Trải nghiệm công cụ giao dịch chuyên nghiệp với dữ liệu thời gian thực',
    features: 'Tính năng',
    backToMainApp: 'Quay lại ứng dụng chính',
    demoMode: 'Chế độ demo',
    realTimeData: 'Dữ liệu thời gian thực',
    interactiveChart: 'Biểu đồ tương tác',
    advancedTooltips: 'Tooltip nâng cao',
    trailingStopVisualization: 'Hiển thị Trailing Stop',
    positionManagement: 'Quản lý vị thế',
    riskAnalysis: 'Phân tích rủi ro',
    performanceMetrics: 'Chỉ số hiệu suất',
    alertSystem: 'Hệ thống cảnh báo',
  },

  status: {
    binanceTestnet: 'Binance Testnet',
    connected: 'Đã kết nối',
    disconnected: 'Mất kết nối',
    loading: 'Đang tải',
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    noData: 'Không có dữ liệu',
    dataLoaded: 'Đã tải dữ liệu',
    updating: 'Đang cập nhật',
    syncing: 'Đang đồng bộ',
    synchronized: 'Đã đồng bộ',
    failed: 'Thất bại',
    retry: 'Thử lại',
    timeout: 'Hết thời gian',
    networkError: 'Lỗi mạng',
    serverError: 'Lỗi máy chủ',
    unauthorized: 'Không được phép',
    forbidden: 'Bị cấm',
    notFound: 'Không tìm thấy',
    conflict: 'Xung đột',
    tooManyRequests: 'Quá nhiều yêu cầu',
    internalError: 'Lỗi nội bộ',
  },

  tooltips: {
    hover: 'Di chuột để xem chi tiết',
    click: 'Nhấp để tương tác',
    doubleClick: 'Nhấp đôi để chỉnh sửa',
    rightClick: 'Nhấp chuột phải để xem tùy chọn',
    drag: 'Kéo để di chuyển',
    drop: 'Thả để đặt',
    scroll: 'Cuộn để điều hướng',
    zoom: 'Thu phóng để thay đổi tỷ lệ',
    pan: 'Kéo để di chuyển khung nhìn',
    select: 'Chọn mục',
    multiSelect: 'Chọn nhiều mục',
    contextMenu: 'Menu ngữ cảnh',
    keyboard: 'Phím tắt',
    mouse: 'Thao tác chuột',
    touch: 'Cử chỉ chạm',
    gesture: 'Điều khiển cử chỉ',
  },

  time: {
    now: 'Bây giờ',
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    tomorrow: 'Ngày mai',
    thisWeek: 'Tuần này',
    lastWeek: 'Tuần trước',
    nextWeek: 'Tuần sau',
    thisMonth: 'Tháng này',
    lastMonth: 'Tháng trước',
    nextMonth: 'Tháng sau',
    thisYear: 'Năm nay',
    lastYear: 'Năm trước',
    nextYear: 'Năm sau',
    seconds: 'giây',
    minutes: 'phút',
    hours: 'giờ',
    days: 'ngày',
    weeks: 'tuần',
    months: 'tháng',
    years: 'năm',
    ago: 'trước',
    from: 'từ',
    to: 'đến',
    until: 'cho đến',
    since: 'kể từ',
    before: 'trước',
    after: 'sau',
    during: 'trong',
    between: 'giữa',
  },

  formatting: {
    currency: 'Tiền tệ',
    percentage: 'Phần trăm',
    decimal: 'Thập phân',
    integer: 'Số nguyên',
    scientific: 'Khoa học',
    compact: 'Gọn',
    thousand: 'K',
    million: 'M',
    billion: 'B',
    trillion: 'T',
    positive: 'Dương',
    negative: 'Âm',
    zero: 'Không',
    infinity: 'Vô cực',
    notANumber: 'Không phải số',
  },
};

// Translation helper functions
export const getTranslations = (language: Language): Translations => {
  switch (language) {
    case 'vi':
      return viTranslations;
    case 'en':
    default:
      return enTranslations;
  }
};

export const getSupportedLanguages = (): { code: Language; name: string; flag: string }[] => [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];
