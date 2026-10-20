import { OrderService } from './OrderService';

export const Controller = {
  async listOrders(params: any) {
    return OrderService.list(params?.status);
  },
  async createOrder(params: any, body: any) {
    return OrderService.create(body.item, body.quantity);
  },
  async getOrder(params: any) {
    const order = OrderService.get(params.orderId);
    if (!order) {
      return new Response(JSON.stringify({ error: `Order ${params.orderId} not found` }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    return order;
  },
};
export default Controller;
