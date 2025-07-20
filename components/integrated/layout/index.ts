// File: components/integrated/layout/index.ts

// Main layout components
export { default as IntegratedLayout, HomePageLayout, TradingPageLayout, BacktestingPageLayout } from './IntegratedLayout';

// Grid system
export {
  ResponsiveGrid,
  GridCol,
  TwoColumnLayout,
  ThreeColumnLayout,
  FourColumnLayout,
  TradingLayout,
  DashboardLayout,
  MarketLayout,
  BacktestLayout,
} from './ResponsiveGrid';

// Card containers
export {
  default as CardContainer,
  StatCard,
  ChartCard,
  TableCard,
  FormCard,
  WidgetCard,
} from './CardContainer';
