import { supabase } from './supabase';

export interface TrailingStopState {
    stateKey: string;
    isActive: boolean;
    status: 'pending_activation' | 'active' | 'triggered' | 'error';
    activationPrice?: number;
    symbol: string;
    entryPrice: number;
    highestPrice: number;
    trailingPercent: number;
    quantity: number;
    checkInterval?: NodeJS.Timeout;
    triggerPrice?: number;
    triggeredAt?: number;
    sellOrderId?: string;
    errorMessage?: string;
}

// Map vẫn được giữ lại để quản lý các interval trong bộ nhớ
export const activeTrailingStops = new Map<string, TrailingStopState>();

// Cập nhật state trong Supabase và Map
export const updateTrailingStopState = async (key: string, state: TrailingStopState) => {
      // 1. Cập nhật Map trong bộ nhớ (nếu cần để quản lý interval)
      const currentState = activeTrailingStops.get(key);
      const intervalId = currentState?.checkInterval; // Giữ lại ID interval nếu có
      activeTrailingStops.set(key, { ...state, checkInterval: intervalId }); // Cập nhật map

    // Chuẩn bị dữ liệu cho Supabase (loại bỏ checkInterval vì không thể lưu trữ)
    const { checkInterval, ...stateForDB } = state;

    try {
        // 3. Upsert vào Supabase
        const { data, error } = await supabase
            .from('trailing_stops')
            .upsert({ // Sử dụng upsert cho đơn giản (chèn nếu chưa có, cập nhật nếu có)
                ...stateForDB,
                stateKey: key, // Đảm bảo stateKey được bao gồm để khớp
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'stateKey' // Chỉ định cột để kiểm tra xung đột
            })
            .select() // Chọn dòng đã chèn/cập nhật
            .single(); // Mong đợi một dòng duy nhất

        if (error) {
            console.error(`[State] Lỗi Supabase upsert cho key ${key}:`, error);
            throw error; // Ném lỗi lại để xử lý ở hàm gọi nếu cần
        }
        console.log(`[State] Trạng thái Supabase đã được upsert cho key ${key}`);

    } catch (dbError) {
        console.error(`[State] Thao tác cơ sở dữ liệu thất bại cho key ${key}:`, dbError);
        // Quyết định cách xử lý lỗi DB (ví dụ: log, có thể thử lại sau?)
    }
};

export const removeTrailingStopState = async (key: string) => {
    const state = activeTrailingStops.get(key);
    if (state?.checkInterval) {
        clearInterval(state.checkInterval);
        console.log(`[State] Đã xóa interval cho key: ${key}`);
    }
    activeTrailingStops.delete(key); // Xóa khỏi map bộ nhớ
    console.log(`[State] Đã xóa mô phỏng khỏi bộ nhớ: ${key}`);

    // Xóa khỏi DB
    const { error } = await supabase
        .from('trailing_stops')
        .delete()
        .eq('stateKey', key);

    if (error) {
        console.error(`[State] Lỗi xóa mô phỏng ${key} khỏi cơ sở dữ liệu:`, error);
    } else {
        console.log(`[State] Đã xóa thành công mô phỏng ${key} khỏi cơ sở dữ liệu.`);
    }
};
// Lấy danh sách trailing stops cho client
export const getActiveSimulationsForClient = async () => {
    try {
        // Check if Supabase is available
        if (!supabase) {
            console.warn('[TrailingStop] Supabase not available, using in-memory data only');
            return Array.from(activeTrailingStops.values()).filter(
                state => state.status === 'pending_activation' || state.status === 'active'
            );
        }

        const { data, error } = await supabase
            .from('trailing_stops')
            .select('*')
            .in('status', ['pending_activation', 'active']);

        if (error) {
            console.error('[TrailingStop] Supabase error:', error.message);
            // Fallback to in-memory data
            console.warn('[TrailingStop] Falling back to in-memory storage');
            return Array.from(activeTrailingStops.values()).filter(
                state => state.status === 'pending_activation' || state.status === 'active'
            );
        }

        console.log(`[TrailingStop] Successfully loaded ${data?.length || 0} simulations from Supabase`);
        return data || [];
    } catch (error: any) {
        console.error('[TrailingStop] Error in getActiveSimulationsForClient:', error.message || error);
        // Fallback to in-memory data
        console.warn('[TrailingStop] Network error, falling back to in-memory storage');
        return Array.from(activeTrailingStops.values()).filter(
            state => state.status === 'pending_activation' || state.status === 'active'
        );
    }
};

// Khôi phục các trailing stops từ Supabase khi khởi động server
export const restoreTrailingStopsFromDB = async () => {
    const { data, error } = await supabase
        .from('trailing_stops')
        .select('*')
        .in('status', ['pending_activation', 'active']);

    if (error) {
        console.error('Error restoring trailing stops:', error);
        return;
    }

    console.log(`Restored ${data.length} trailing stops from database`);

    for (const stop of data) {
        const { state_key, ...rest } = stop;

        // Recreate the trailing stop state
        const trailingStopState: TrailingStopState = {
            stateKey: state_key,
            ...rest,
        };

        // Add to the activeTrailingStops map
        activeTrailingStops.set(state_key, trailingStopState);

        // Restart the interval if the status is active
        if (trailingStopState.status === 'active') {
            trailingStopState.checkInterval = setInterval(() => {
                // Add your logic to check and update the trailing stop here
                // console.log(`[${trailingStopState.stateKey}] Checking trailing stop...`);
            }, 1000); // Example interval of 1 second
        }
    }
};

export const initializeTrailingStopsTable = async () => {
    try {
        const { error } = await supabase.rpc('check_or_create_trailing_stops_table');
        if (error) {
            console.error('Error initializing trailing_stops table:', error.message);
        } else {
            console.log('Trailing stops table initialized successfully.');
        }
    } catch (error) {
        console.error('Unexpected error while initializing trailing_stops table:', error);
    }
};

// Call this function during application startup
await initializeTrailingStopsTable();
await restoreTrailingStopsFromDB();