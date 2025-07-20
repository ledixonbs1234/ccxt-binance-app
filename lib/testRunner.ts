// File: lib/testRunner.ts

// Test runner for state management system
export interface TestCase {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  expectedResult: any;
  actualResult?: any;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  expectedResult?: any;
  actualResult?: any;
}

export class TestRunner {
  private results: TestResult[] = [];

  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`🧪 Running test suite: ${suite.name}`);
    
    // Setup
    if (suite.setup) {
      try {
        await suite.setup();
        console.log(`✅ Setup completed for ${suite.name}`);
      } catch (error) {
        console.error(`❌ Setup failed for ${suite.name}:`, error);
        return [];
      }
    }

    const suiteResults: TestResult[] = [];

    // Run tests
    for (const testCase of suite.tests) {
      const startTime = Date.now();
      let passed = false;
      let error: string | undefined;
      let actualResult: any;

      try {
        console.log(`  🔍 Running: ${testCase.name}`);
        actualResult = await testCase.test();
        passed = actualResult === true || actualResult === testCase.expectedResult;
        
        if (passed) {
          console.log(`  ✅ ${testCase.name} - PASSED`);
        } else {
          console.log(`  ❌ ${testCase.name} - FAILED`);
          console.log(`    Expected: ${testCase.expectedResult}`);
          console.log(`    Actual: ${actualResult}`);
        }
      } catch (err) {
        passed = false;
        error = err instanceof Error ? err.message : String(err);
        console.log(`  ❌ ${testCase.name} - ERROR: ${error}`);
      }

      const duration = Date.now() - startTime;
      const result: TestResult = {
        suiteName: suite.name,
        testName: testCase.name,
        passed,
        duration,
        error,
        expectedResult: testCase.expectedResult,
        actualResult,
      };

      suiteResults.push(result);
      this.results.push(result);
    }

    // Teardown
    if (suite.teardown) {
      try {
        await suite.teardown();
        console.log(`✅ Teardown completed for ${suite.name}`);
      } catch (error) {
        console.error(`❌ Teardown failed for ${suite.name}:`, error);
      }
    }

    const passedCount = suiteResults.filter(r => r.passed).length;
    const totalCount = suiteResults.length;
    console.log(`📊 Suite ${suite.name}: ${passedCount}/${totalCount} tests passed`);

    return suiteResults;
  }

  async runAllSuites(suites: TestSuite[]): Promise<TestResult[]> {
    console.log(`🚀 Starting test run with ${suites.length} suites`);
    
    for (const suite of suites) {
      await this.runSuite(suite);
    }

    this.printSummary();
    return this.results;
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📈 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Duration: ${(totalDuration / totalTests).toFixed(1)}ms`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ${r.suiteName} > ${r.testName}`);
          if (r.error) {
            console.log(`    Error: ${r.error}`);
          }
        });
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  clearResults(): void {
    this.results = [];
  }
}

// Mock data and utilities for testing
export const mockData = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    isAuthenticated: true,
    preferences: {
      theme: 'light' as const,
      language: 'vi' as const,
      defaultTimeframe: '1h' as const,
      defaultTradingPair: 'BTCUSDT',
      notifications: {
        orderFilled: true,
        priceAlerts: true,
        systemUpdates: false,
      },
      trading: {
        confirmOrders: true,
        defaultOrderType: 'limit' as const,
        riskManagement: {
          maxPositionSize: 1000,
          stopLossPercentage: 2,
          takeProfitPercentage: 5,
        },
      },
    },
    createdAt: new Date(),
    lastLoginAt: new Date(),
  },

  coins: [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      price: 45000,
      change24h: 1200,
      changePercent24h: 2.74,
      volume24h: 28500000000,
      marketCap: 850000000000,
      high24h: 46000,
      low24h: 43500,
      lastUpdated: new Date(),
      rank: 1,
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum',
      price: 3200,
      change24h: -85,
      changePercent24h: -2.59,
      volume24h: 15200000000,
      marketCap: 385000000000,
      high24h: 3350,
      low24h: 3150,
      lastUpdated: new Date(),
      rank: 2,
    },
  ],

  order: {
    symbol: 'BTCUSDT',
    side: 'buy' as const,
    type: 'market' as const,
    amount: 0.001,
  },

  notification: {
    type: 'success' as const,
    title: 'Test Notification',
    message: 'This is a test notification',
    category: 'system' as const,
    priority: 'medium' as const,
    persistent: false,
  },

  priceAlert: {
    symbol: 'BTCUSDT',
    condition: 'above' as const,
    targetValue: 50000,
    currentValue: 45000,
    enabled: true,
  },
};

// Test utilities
export const testUtils = {
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  waitFor: async (condition: () => boolean, timeout: number = 5000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await testUtils.delay(100);
    }
    return false;
  },

  expectToEqual: (actual: any, expected: any): boolean => {
    return JSON.stringify(actual) === JSON.stringify(expected);
  },

  expectToBeTruthy: (value: any): boolean => {
    return !!value;
  },

  expectToBeFalsy: (value: any): boolean => {
    return !value;
  },

  expectToContain: (array: any[], item: any): boolean => {
    return array.includes(item);
  },

  expectToHaveLength: (array: any[], length: number): boolean => {
    return array.length === length;
  },

  expectToBeGreaterThan: (actual: number, expected: number): boolean => {
    return actual > expected;
  },

  expectToBeLessThan: (actual: number, expected: number): boolean => {
    return actual < expected;
  },

  expectToThrow: async (fn: () => Promise<any>): Promise<boolean> => {
    try {
      await fn();
      return false;
    } catch {
      return true;
    }
  },
};

// Example test suite
export const createExampleTestSuite = (): TestSuite => ({
  name: 'State Management System',
  setup: async () => {
    console.log('Setting up test environment...');
    // Setup code here
  },
  teardown: async () => {
    console.log('Cleaning up test environment...');
    // Cleanup code here
  },
  tests: [
    {
      name: 'Context Initialization',
      description: 'Verify all contexts are properly initialized',
      expectedResult: true,
      test: async () => {
        // This would be implemented with actual context checks
        return true;
      },
    },
    {
      name: 'User Authentication',
      description: 'Test user login and logout functionality',
      expectedResult: true,
      test: async () => {
        // Mock user authentication test
        await testUtils.delay(100);
        return true;
      },
    },
    {
      name: 'Market Data Fetching',
      description: 'Test market data loading and updates',
      expectedResult: true,
      test: async () => {
        // Mock market data test
        await testUtils.delay(200);
        return true;
      },
    },
    {
      name: 'Order Creation',
      description: 'Test order creation and management',
      expectedResult: true,
      test: async () => {
        // Mock order creation test
        await testUtils.delay(150);
        return true;
      },
    },
    {
      name: 'Notification System',
      description: 'Test notification creation and management',
      expectedResult: true,
      test: async () => {
        // Mock notification test
        await testUtils.delay(100);
        return true;
      },
    },
  ],
});

// Export singleton test runner
export const testRunner = new TestRunner();
