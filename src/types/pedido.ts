import type { Order, OrderItem, PaymentStatus } from "@prisma/client";

export type Pedido = Order;
export type ItemPedido = OrderItem;
export type StatusPagamentoPedido = PaymentStatus;
