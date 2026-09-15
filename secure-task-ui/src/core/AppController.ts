import { currentUser, documents as seedDocuments, notifications as seedNotifications, tasks as seedTasks } from '../data/mockData';
import { DocumentItem, NotificationItem, Task, User } from '../domain/models';
import type { RouteName } from '../types';
import { AccessService } from '../services/AccessService';
import { AuditService } from '../services/AuditService';
import { StorageService } from '../services/StorageService';

export class AppController {
  readonly accessService = new AccessService();
  readonly auditService = new AuditService();
  readonly storageService = new StorageService();

  user: User;
  route: RouteName = 'dashboard';
  tasks: Task[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  selectedTaskId: string;
  selectedDocumentId: string;

  constructor() {
    this.user = User.fromSeed(currentUser);
    this.tasks = this.storageService.load('tasks', seedTasks.map(Task.fromSeed));
    this.documents = this.storageService.load('documents', seedDocuments.map(DocumentItem.fromSeed));
    this.notifications = this.storageService.load('notifications', seedNotifications.map(NotificationItem.fromSeed));
    this.selectedTaskId = this.tasks[0]?.id ?? 't1';
    this.selectedDocumentId = this.documents[0]?.id ?? 'd1';
  }

  get selectedTask() {
    return this.tasks.find((task) => task.id === this.selectedTaskId) ?? this.tasks[0];
  }

  get selectedDocument() {
    return this.documents.find((doc) => doc.id === this.selectedDocumentId) ?? this.documents[0];
  }

  get unreadNotificationsCount() {
    return this.notifications.filter((notification) => notification.unread).length;
  }

  navigate(route: RouteName): void {
    if (!this.accessService.canAccessRoute(route, this.user)) {
      this.route = 'dashboard';
      return;
    }

    this.route = route;
  }

  openTask(id: string): void {
    this.selectedTaskId = id;
    this.route = 'task-detail';
  }

  openDocument(id: string): void {
    this.selectedDocumentId = id;
    this.route = 'document-detail';
  }

  createTask(input: Partial<Task> = {}): Task {
    const now = new Date();
    const task = new Task(
      `t${now.getTime()}`,
      input.title ?? 'New security review task',
      input.description ?? 'A newly created task for the secure workflow pipeline.',
      input.status ?? 'Pending',
      input.priority ?? 'Medium',
      input.assignee ?? this.user.name,
      input.dueDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );

    this.tasks = [task, ...this.tasks];
    this.selectedTaskId = task.id;
    this.route = 'task-detail';
    this.auditService.log('Created task', task.title, this.user);
    this.persist();
    return task;
  }

  uploadDocument(input: Partial<DocumentItem> = {}): DocumentItem {
    const now = new Date();
    const document = new DocumentItem(
      `d${now.getTime()}`,
      input.fileName ?? `new-upload-${this.documents.length + 1}.pdf`,
      input.type ?? 'PDF',
      input.size ?? '1.2 MB',
      input.uploadedBy ?? this.user.name,
      input.uploadedAt ?? now.toISOString().slice(0, 10),
      input.linkedTask,
    );

    this.documents = [document, ...this.documents];
    this.selectedDocumentId = document.id;
    this.route = 'document-detail';
    this.auditService.log('Uploaded document', document.fileName, this.user);
    this.persist();
    return document;
  }

  markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((notification) => ({ ...notification, unread: false }));
    this.persist();
  }

  persist(): void {
    this.storageService.save('tasks', this.tasks);
    this.storageService.save('documents', this.documents);
    this.storageService.save('notifications', this.notifications);
  }
}
