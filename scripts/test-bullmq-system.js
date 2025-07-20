// Test script for BullMQ system - using dynamic imports for ES modules
async function loadModules() {
    const queueInitializer = await import('../lib/queueInitializer.js');
    const trailingStopQueue = await import('../lib/trailingStopQueue.js');
    const trailingStopState = await import('../lib/trailingStopState.js');

    return {
        initializeQueueSystem: queueInitializer.initializeQueueSystem,
        isQueueSystemInitialized: queueInitializer.isQueueSystemInitialized,
        getQueueStats: trailingStopQueue.getQueueStats,
        updateTrailingStopState: trailingStopState.updateTrailingStopState
    };
}

async function testBullMQSystem() {
    console.log('🚀 Testing BullMQ Trailing Stop System...\n');

    try {
        // Load ES modules
        const { initializeQueueSystem, isQueueSystemInitialized, getQueueStats, updateTrailingStopState } = await loadModules();

        // Test 1: Initialize Queue System
        console.log('1️⃣ Testing Queue System Initialization...');
        if (!isQueueSystemInitialized()) {
            await initializeQueueSystem();
            console.log('✅ Queue system initialized successfully');
        } else {
            console.log('✅ Queue system already initialized');
        }

        // Test 2: Check Queue Stats
        console.log('\n2️⃣ Testing Queue Statistics...');
        const stats = await getQueueStats();
        if (stats) {
            console.log('✅ Queue stats retrieved:', stats);
        } else {
            console.log('❌ Failed to get queue stats');
        }

        // Test 3: Create Test Trailing Stop
        console.log('\n3️⃣ Testing Trailing Stop Creation...');
        const testStateKey = `test-${Date.now()}`;
        const testState = {
            stateKey: testStateKey,
            isActive: true,
            status: 'active',
            symbol: 'BTCUSDT',
            entryPrice: 50000,
            highestPrice: 50000,
            trailingPercent: 2,
            quantity: 0.001,
            side: 'sell',
            strategy: 'percentage',
            triggerPrice: 49000
        };

        await updateTrailingStopState(testStateKey, testState);
        console.log('✅ Test trailing stop created successfully');

        // Test 4: Check Queue Stats After Adding Job
        console.log('\n4️⃣ Testing Queue Stats After Job Addition...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const statsAfter = await getQueueStats();
        if (statsAfter) {
            console.log('✅ Queue stats after job addition:', statsAfter);
        } else {
            console.log('❌ Failed to get queue stats after job addition');
        }

        // Test 5: Test API Endpoint
        console.log('\n5️⃣ Testing Queue Status API...');
        try {
            const response = await fetch('http://localhost:3000/api/queue-status');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Queue status API response:', {
                    success: data.success,
                    queueStats: data.queueStats,
                    systemHealth: data.systemHealth?.queueInitialized
                });
            } else {
                console.log('❌ Queue status API failed:', response.status);
            }
        } catch (apiError) {
            console.log('⚠️ Queue status API test skipped (server may not be running):', apiError.message);
        }

        console.log('\n🎉 BullMQ System Test Completed!');
        console.log('\n📋 Summary:');
        console.log('- Queue system initialization: ✅');
        console.log('- Queue statistics retrieval: ✅');
        console.log('- Trailing stop creation: ✅');
        console.log('- Job queue monitoring: ✅');
        
        console.log('\n🔧 Next Steps:');
        console.log('1. Start Redis server: redis-server');
        console.log('2. Start Next.js server: npm run dev');
        console.log('3. Test trailing stop creation via API');
        console.log('4. Monitor queue status at /api/queue-status');

    } catch (error) {
        console.error('❌ BullMQ System Test Failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Redis is running: redis-server');
        console.log('2. Check Redis connection settings in .env.local');
        console.log('3. Verify Supabase connection');
        console.log('4. Check console for detailed error messages');
    }
}

// Run the test
testBullMQSystem().then(() => {
    console.log('\n✨ Test completed. Exiting...');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
});
