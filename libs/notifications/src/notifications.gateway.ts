import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ProfileUpdatedEvent } from '@attendance/messaging';
import { Server, Socket } from 'socket.io';
import { HRD_ROOM, PROFILE_UPDATED_SOCKET_EVENT } from './notification-events';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    void client.join(HRD_ROOM);
  }

  handleDisconnect(client: Socket): void {
    void client.leave(HRD_ROOM);
  }

  emitProfileUpdated(event: ProfileUpdatedEvent): void {
    this.server.to(HRD_ROOM).emit(PROFILE_UPDATED_SOCKET_EVENT, event);
  }
}
