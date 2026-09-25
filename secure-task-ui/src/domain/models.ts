export type Role = 'Admin' | 'Manager' | 'Member';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
export type Priority = 'Low' | 'Medium' | 'High';

export abstract class BaseModel {
  constructor(public readonly id: string) {}
}

export class User extends BaseModel {
  constructor(
    id: string,
    public name: string,
    public email: string,
    public role: Role,
    public status: 'Active' | 'Inactive' | 'Invited',
  ) {
    super(id);
  }

  static fromSeed(seed: { id: string; name: string; email: string; role: Role; status: 'Active' | 'Inactive' | 'Invited' }) {
    return new User(seed.id, seed.name, seed.email, seed.role, seed.status);
  }

  isAdmin(): boolean {
    return this.role === 'Admin';
  }
}

export class Task extends BaseModel {
  constructor(
    id: string,
    public title: string,
    public description: string,
    public status: TaskStatus,
    public priority: Priority,
    public assignee: string,
    public dueDate: string,
  ) {
    super(id);
  }

  static fromSeed(seed: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    assignee: string;
    dueDate: string;
  }) {
    return new Task(
      seed.id,
      seed.title,
      seed.description,
      seed.status,
      seed.priority,
      seed.assignee,
      seed.dueDate,
    );
  }
}

export class DocumentItem extends BaseModel {
  constructor(
    id: string,
    public fileName: string,
    public type: string,
    public size: string,
    public uploadedBy: string,
    public uploadedAt: string,
    public linkedTask?: string,
  ) {
    super(id);
  }

  static fromSeed(seed: {
    id: string;
    fileName: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
    linkedTask?: string;
  }) {
    return new DocumentItem(
      seed.id,
      seed.fileName,
      seed.type,
      seed.size,
      seed.uploadedBy,
      seed.uploadedAt,
      seed.linkedTask,
    );
  }
}

export class NotificationItem extends BaseModel {
  constructor(
    id: string,
    public message: string,
    public type: 'Task' | 'Document' | 'Security',
    public unread: boolean,
    public createdAt: string,
  ) {
    super(id);
  }

  static fromSeed(seed: {
    id: string;
    message: string;
    type: 'Task' | 'Document' | 'Security';
    unread: boolean;
    createdAt: string;
  }) {
    return new NotificationItem(seed.id, seed.message, seed.type, seed.unread, seed.createdAt);
  }
}

export class AuditLog extends BaseModel {
  constructor(
    id: string,
    public time: string,
    public user: string,
    public action: string,
    public entity: string,
    public ipAddress: string,
  ) {
    super(id);
  }

  static fromSeed(seed: {
    id: string;
    time: string;
    user: string;
    action: string;
    entity: string;
    ipAddress: string;
  }) {
    return new AuditLog(seed.id, seed.time, seed.user, seed.action, seed.entity, seed.ipAddress);
  }
}
