export interface TrailingStopState {
    isActive: boolean;
    symbol: string;
    entryPrice: number;
    highestPrice: number;
    trailingPercent: number;
    quantity: number;
    orderId?: string;
    checkInterval?: NodeJS.Timeout;
    // Thêm stateKey để dễ nhận diện khi trả về client
    stateKey: string;
    status?: 'active' | 'triggered' | 'error'; // Trạng thái của simulation
    triggeredAt?: number; // Thời điểm kích hoạt (timestamp)
    triggerPrice?: number; // Giá kích hoạt thực tế
    sellOrderId?: string; // ID lệnh bán được tạo ra (nếu thành công)
    errorMessage?: string; // Lưu lỗi nếu đặt lệnh bán thất bại
}

// Lưu trữ state trong bộ nhớ (Không dùng cho production!)
// Dùng Map để dễ quản lý hơn object thông thường
export const activeTrailingStops = new Map<string, TrailingStopState>();

// Hàm thêm/cập nhật state (có thể thêm nếu cần logic phức tạp hơn)
export const updateTrailingStopState = (key: string, state: TrailingStopState) => {
    activeTrailingStops.set(key, state);
};

export const removeTrailingStopState = (key: string) => {
    const state = activeTrailingStops.get(key);
    if (state) {
        if (state.checkInterval) {
            console.log(`[${key}] removeTrailingStopState: Clearing interval ID: ${state.checkInterval}`);
            clearInterval(state.checkInterval);
        } else {
             console.log(`[${key}] removeTrailingStopState: No interval ID found in state to clear.`);
        }
        activeTrailingStops.delete(key);
        console.log(`[${key}] Removed trailing stop state from Map.`);
    } else {
         console.log(`[${key}] removeTrailingStopState: State already removed.`);
    }
};
// Hàm lấy tất cả state đang hoạt động (để trả về cho client)
// Lọc bỏ checkInterval vì không thể serialize và không cần thiết ở client
// Cập nhật hàm getActiveSimulationsForClient để bao gồm trạng thái mới
export const getActiveSimulationsForClient = () => {
    const simulations = [];
    // Vẫn trả về cả các lệnh vừa triggered để UI hiển thị
    for (const [key, state] of activeTrailingStops.entries()) {
         // Bỏ checkInterval khi gửi về client
        const { checkInterval, ...clientState } = state;
        simulations.push(clientState);
    }
    console.log(`Returning ${simulations.length} active simulations to client.`);
    // Có thể sắp xếp theo thời gian kích hoạt hoặc trạng thái nếu muốn
    simulations.sort((a, b) => (b.triggeredAt ?? 0) - (a.triggeredAt ?? 0));
    return simulations;
};