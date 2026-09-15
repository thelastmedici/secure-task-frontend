import type { User } from '../domain/models';

export class AuditService {
  log(action: string, entity: string, user: User, ipAddress = '127.0.0.1') {
    return {
      time: new Date().toISOString(),
      action,
      entity,
      user: user.name,
      ipAddress,
    };
  }
}
