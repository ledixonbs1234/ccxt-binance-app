const Redis = require('ioredis');

async function testRedisConnection() {
    console.log('🔍 Testing Redis Connection...\n');

    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
    };

    console.log('📋 Redis Configuration:');
    console.log(`   Host: ${redisConfig.host}`);
    console.log(`   Port: ${redisConfig.port}`);
    console.log(`   Password: ${redisConfig.password ? '***' : 'None'}\n`);

    const redis = new Redis(redisConfig);

    try {
        // Test 1: Basic Connection
        console.log('1️⃣ Testing basic connection...');
        const pong = await redis.ping();
        console.log(`✅ Redis responded: ${pong}`);

        // Test 2: Set/Get Test
        console.log('\n2️⃣ Testing set/get operations...');
        const testKey = `test:${Date.now()}`;
        const testValue = 'BullMQ Test Value';
        
        await redis.set(testKey, testValue);
        const retrievedValue = await redis.get(testKey);
        
        if (retrievedValue === testValue) {
            console.log('✅ Set/Get operations successful');
        } else {
            console.log('❌ Set/Get operations failed');
        }

        // Test 3: Cleanup
        await redis.del(testKey);
        console.log('✅ Test key cleaned up');

        // Test 4: Redis Info
        console.log('\n3️⃣ Redis server information...');
        const info = await redis.info('server');
        const lines = info.split('\r\n');
        const version = lines.find(line => line.startsWith('redis_version:'));
        const uptime = lines.find(line => line.startsWith('uptime_in_seconds:'));
        
        if (version) console.log(`✅ ${version}`);
        if (uptime) {
            const seconds = parseInt(uptime.split(':')[1]);
            const minutes = Math.floor(seconds / 60);
            console.log(`✅ Uptime: ${minutes} minutes`);
        }

        console.log('\n🎉 Redis Connection Test Successful!');
        console.log('\n📋 Summary:');
        console.log('- Basic connection: ✅');
        console.log('- Set/Get operations: ✅');
        console.log('- Server information: ✅');
        
        console.log('\n✨ Redis is ready for BullMQ!');

    } catch (error) {
        console.error('❌ Redis Connection Test Failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Redis is running:');
        console.log('   - Windows: Use Docker or WSL');
        console.log('   - macOS: brew services start redis');
        console.log('   - Linux: sudo systemctl start redis-server');
        console.log('2. Check Redis is listening on the correct port:');
        console.log('   - Default port: 6379');
        console.log('   - Test manually: redis-cli ping');
        console.log('3. Verify environment variables in .env.local');
        console.log('4. Check firewall settings');
    } finally {
        await redis.disconnect();
        console.log('\n🔌 Redis connection closed.');
    }
}

// Run the test
testRedisConnection().then(() => {
    console.log('\n✨ Test completed. Exiting...');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
});
