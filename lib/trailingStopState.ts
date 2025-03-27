export interface TrailingStopState {
    stateKey: string;
    isActive: boolean; // Vẫn dùng isActive để biết interval còn chạy không
    // Cập nhật status
    status?: 'pending_activation' | 'active' | 'triggered' | 'error';
    symbol: string;
    entryPrice: number; // Giá tham chiếu ban đầu (vẫn lưu lại)
    activationPrice?: number; // Giá kích hoạt (nếu có)
    highestPrice: number; // Giá cao nhất (tính từ lúc active)
    trailingPercent: number;
    quantity: number;
    checkInterval?: NodeJS.Timeout;
    triggeredAt?: number;
    triggerPrice?: number;
    sellOrderId?: string;
    errorMessage?: string;
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