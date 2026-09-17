import { currentUser, documents as seedDocuments, notifications as seedNotifications, tasks as seedTasks, users as seedUsers } from '../data/mockData';
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
  lastError: string | null = null;
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

  private subscribers: Array<(c: AppController) => void> = [];

  subscribe(fn: (c: AppController) => void) {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private notify() {
    this.subscribers.forEach((s) => {
      try {
        s(this);
      } catch {
        // swallow listener errors to keep controller resilient
      }
    });
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
    const denied = !this.accessService.canAccessRoute(route, this.user);
    if (denied) {
      const reason = this.accessService.deniedReason(route, this.user) ?? 'Access denied';
      this.lastError = reason;
      this.route = 'dashboard';
      this.notify();
      return;
    }

    this.lastError = null;
    this.route = route;
    this.notify();
  }

  clearError() {
    this.lastError = null;
    this.notify();
  }

  openTask(id: string): void {
    this.selectedTaskId = id;
    this.route = 'task-detail';
    this.notify();
  }

  openDocument(id: string): void {
    this.selectedDocumentId = id;
    this.route = 'document-detail';
    this.notify();
  }

  createTask(input: Partial<Task> = {}): Task {
    if (!this.accessService.canCreateTask(this.user)) {
      this.lastError = 'You do not have permission to create tasks.';
      this.notify();
      return null as any;
    }
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
    // create a notification for the creation
    const notif = new NotificationItem(`n${now.getTime()}`, `Task created: ${task.title}`, 'Task', true, now.toISOString());
    this.notifications = [notif, ...this.notifications];
    this.persist();
    this.notify();
    return task;
  }

  uploadDocument(input: Partial<DocumentItem> = {}): DocumentItem {
    if (!this.accessService.canUploadDocument(this.user)) {
      this.lastError = 'You do not have permission to upload documents.';
      this.notify();
      return null as any;
    }
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
    const notif = new NotificationItem(`n${now.getTime()}`, `${this.user.name} uploaded ${document.fileName}`, 'Document', true, now.toISOString());
    this.notifications = [notif, ...this.notifications];
    this.persist();
    this.notify();
    return document;
  }

  markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((notification) => ({ ...notification, unread: false }));
    this.persist();
    this.notify();
  }

  login(email: string, password: string): boolean {
    // simple credential check against seed users present in mockData
    try {
      const users = seedUsers;
      const found = users.find((u: any) => u.email === email && password === 'password');
      if (!found) {
        this.lastError = 'Invalid credentials';
        this.notify();
        return false;
      }

      this.user = User.fromSeed(found);
      const token = `token-${this.user.id}-${Date.now()}`;
      this.storageService.save('sessionToken', token);
      this.storageService.save('sessionUserId', this.user.id);
      this.route = 'dashboard';
      this.lastError = null;
      this.notify();
      return true;
    } catch (e) {
      this.lastError = 'Login error';
      this.notify();
      return false;
    }
  }

  logout(): void {
    this.storageService.save('sessionToken', null as any);
    this.storageService.save('sessionUserId', null as any);
    this.route = 'login';
    this.lastError = null;
    this.notify();
  }

  persist(): void {
    this.storageService.save('tasks', this.tasks);
    this.storageService.save('documents', this.documents);
    this.storageService.save('notifications', this.notifications);
  }
}
