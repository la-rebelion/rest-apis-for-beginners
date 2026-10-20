// A tiny in-memory "database" with fictional orders.
const orders = [
  { id: 'A-1001', item: 'Rebel Roast, 1 kg', quantity: 2, status: 'shipped' },
  { id: 'A-1002', item: 'Cold Brew Kit', quantity: 1, status: 'pending' },
  { id: 'A-1003', item: 'Lion Mug', quantity: 4, status: 'delivered' },
];

export const OrderService = {
  list(status?: string) {
    return status ? orders.filter((o) => o.status === status) : orders;
  },
  get(id: string) {
    return orders.find((o) => o.id === id);
  },
  create(item: string, quantity: number) {
    const order = { id: `A-${1001 + orders.length}`, item, quantity, status: 'pending' };
    orders.push(order);
    return order;
  },
};
