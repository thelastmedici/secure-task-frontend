import {
  auditLogs as seedAuditLogs,
  currentUser,
  documents as seedDocuments,
  notifications as seedNotifications,
  tasks as seedTasks,
  users as seedUsers,
} from '../data/mockData';
import { AuditLog, DocumentItem, NotificationItem, Task, User } from '../domain/models';
import type { RouteName, WorkspaceSettings } from '../types';
import { AccessService } from '../services/AccessService';
import { ApiClient, ApiError } from '../services/ApiClient';
import { AuditService } from '../services/AuditService';
import { StorageService } from '../services/StorageService';

type SecretCredential = {
  salt: string;
  hash: string;
};

const defaultWorkspaceSettings: WorkspaceSettings = {
  maxUploadSizeMb: 25,
  allowedFileTypes: ['PDF', 'DOCX', 'XLSX', 'PNG'],
};

export class AppController {
  readonly accessService = new AccessService();
  readonly auditService = new AuditService();
  readonly apiClient = new ApiClient();
  readonly storageService = new StorageService();

  user: User;
  lastError: string | null = null;
  lastSuccess: string | null = null;
  route: RouteName = 'login';
  tasks: Task[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  users: User[];
  auditLogs: AuditLog[];
  workspaceSettings: WorkspaceSettings;
  selectedTaskId: string;
  selectedDocumentId: string;
  private passwordCredentials: Record<string, SecretCredential>;
  private twoFactorCredentials: Record<string, SecretCredential>;

  constructor() {
    this.user = User.fromSeed(currentUser);
    this.tasks = this.storageService.load('tasks', seedTasks.map(Task.fromSeed));
    this.documents = this.storageService.load('documents', seedDocuments.map(DocumentItem.fromSeed));
    this.notifications = this.storageService.load('notifications', seedNotifications.map(NotificationItem.fromSeed));
    const storedUsers = this.storageService.load('users', seedUsers);
    this.users = storedUsers.map(User.fromSeed);
    this.auditLogs = this.storageService.load('auditLogs', seedAuditLogs.map(AuditLog.fromSeed));
    this.workspaceSettings = this.storageService.load('workspaceSettings', defaultWorkspaceSettings);
    this.passwordCredentials = this.storageService.load('passwordCredentials', {});
    this.twoFactorCredentials = this.storageService.load('twoFactorCredentials', {});

    const storedUserId = this.storageService.load<string | null>('sessionUserId', null);
    const storedToken = this.storageService.load<string | null>('sessionToken', null);
    if (storedToken && storedUserId) {
      const sessionUser = this.users.find((candidate) => candidate.id === storedUserId);
      if (sessionUser) {
        this.user = sessionUser;
        this.route = 'dashboard';
      }
    }

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

  private async createCredential(secret: string): Promise<SecretCredential> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const secretBytes = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey('raw', secretBytes, 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256);
    return { salt: Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join(''), hash: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('') };
  }

  private async credentialMatches(secret: string, credential: SecretCredential): Promise<boolean> {
    const salt = Uint8Array.from(credential.salt.match(/.{1,2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
    const secretBytes = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey('raw', secretBytes, 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256);
    const actualHash = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return actualHash === credential.hash;
  }

  private addAuditEntry(action: string, entity: string): void {
    const now = new Date();
    this.auditLogs = [new AuditLog(`a${now.getTime()}`, now.toISOString(), this.user.name, action, entity, '127.0.0.1'), ...this.auditLogs];
    this.auditService.log(action, entity, this.user);
  }

  navigate(route: RouteName): void {
    if (route === 'login') {
      this.lastError = null;
      this.route = 'login';
      this.notify();
      return;
    }

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
    this.lastSuccess = null;
    this.notify();
  }

  private normalizeUserResponse(payload: unknown): User | null {
    if (!payload || typeof payload !== 'object') return null;
    const record = 'user' in payload && payload.user && typeof payload.user === 'object' ? (payload.user as Partial<User>) : (payload as Partial<User>);
    const id = typeof record.id === 'string' && record.id ? record.id : null;
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
    const role = typeof record.role === 'string' && ['Admin', 'Manager', 'Member'].includes(record.role) ? record.role as User['role'] : null;
    const status = typeof record.status === 'string' && ['Active', 'Inactive', 'Invited'].includes(record.status) ? record.status as User['status'] : 'Active';

    if (!id || !name || !email || !role) return null;
    return new User(id, name, email, role, status);
  }

  private getSessionToken(): string | null {
    return this.storageService.load<string | null>('sessionToken', null);
  }

  async inviteUser(input: { name: string; email: string; role: User['role'] }): Promise<User | null> {
    if (!this.accessService.canManageUsers(this.user)) {
      this.lastError = 'Only administrators can invite users.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) {
      this.lastError = 'Please enter the user name.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.lastError = 'Please enter a valid email address.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }
    if (this.users.some((user) => user.email.toLowerCase() === email)) {
      this.lastError = 'A user with that email already exists.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }

    const invite = new User(`u${Date.now()}`, name, email, input.role, 'Invited');

    try {
      const remoteUser = await this.apiClient.inviteUser({ name, email, role: input.role }, this.getSessionToken());
      const normalizedUser = this.normalizeUserResponse(remoteUser ?? { user: invite });
      const savedUser = normalizedUser ?? invite;
      this.users = [savedUser, ...this.users.filter((user) => user.email.toLowerCase() !== email)];
      this.addAuditEntry('Invited User', email);
      this.lastError = null;
      this.lastSuccess = `Invitation sent to ${savedUser.email}.`;
      this.persist();
      this.notify();
      return savedUser;
    } catch (error) {
      this.users = [invite, ...this.users];
      this.addAuditEntry('Invited User', email);
      this.lastError = null;
      this.lastSuccess = `Invitation sent to ${invite.email}.`;
      this.persist();
      this.notify();
      if (error instanceof ApiError && error.message) {
        this.lastSuccess = `${error.message} The local invitation was recorded.`;
      }
      return invite;
    }
  }

  async updateUser(id: string, input: { name: string; role: User['role']; status: User['status'] }): Promise<User | null> {
    if (!this.accessService.canManageUsers(this.user)) {
      this.lastError = 'Only administrators can manage users.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }

    const nextName = input.name.trim();
    if (!nextName) {
      this.lastError = 'Please enter the user name.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }

    const existingUser = this.users.find((candidate) => candidate.id === id);
    if (!existingUser) {
      this.lastError = 'User not found.';
      this.lastSuccess = null;
      this.notify();
      return null;
    }

    const updatedUser = new User(existingUser.id, nextName, existingUser.email, input.role, input.status);

    try {
      const remoteUser = await this.apiClient.updateUser(id, { name: nextName, role: input.role, status: input.status }, this.getSessionToken());
      const normalizedUser = this.normalizeUserResponse(remoteUser ?? { user: updatedUser });
      if (normalizedUser) {
        this.users = this.users.map((candidate) => candidate.id === id ? normalizedUser : candidate);
      } else {
        this.users = this.users.map((candidate) => candidate.id === id ? updatedUser : candidate);
      }
    } catch {
      this.users = this.users.map((candidate) => candidate.id === id ? updatedUser : candidate);
    }

    this.addAuditEntry('Updated User', updatedUser.email);
    this.lastError = null;
    this.lastSuccess = `${updatedUser.name} was updated successfully.`;
    this.persist();
    this.notify();
    return this.users.find((candidate) => candidate.id === id) ?? updatedUser;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      this.lastError = 'Please enter a valid email address.';
      this.lastSuccess = null;
      this.notify();
      return false;
    }

    try {
      await this.apiClient.requestPasswordReset(normalizedEmail);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        this.lastError = 'Unable to reach the service. Please try again.';
        this.lastSuccess = null;
        this.notify();
        return false;
      }
    }

    this.lastError = null;
    this.lastSuccess = 'Password reset link sent. If an account exists for that email, you will receive it shortly.';
    this.notify();
    return true;
  }

  updateProfile(name: string, email: string): boolean {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName) {
      this.lastError = 'Please enter your name.';
      this.notify();
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      this.lastError = 'Please enter a valid email address.';
      this.notify();
      return false;
    }
    if (this.users.some((candidate) => candidate.id !== this.user.id && candidate.email.toLowerCase() === normalizedEmail)) {
      this.lastError = 'That email address is already in use.';
      this.notify();
      return false;
    }

    this.user = new User(this.user.id, normalizedName, normalizedEmail, this.user.role, this.user.status);
    this.users = this.users.map((candidate) => candidate.id === this.user.id ? this.user : candidate);
    this.addAuditEntry('Updated Profile', this.user.email);
    this.lastError = null;
    this.persist();
    this.notify();
    return true;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 12 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      this.lastError = 'Use at least 12 characters with uppercase, lowercase, and a number.';
      this.notify();
      return false;
    }

    const credential = this.passwordCredentials[this.user.id];
    const currentPasswordMatches = credential ? await this.credentialMatches(currentPassword, credential) : currentPassword === 'password';
    if (!currentPasswordMatches) {
      this.lastError = 'Your current password is incorrect.';
      this.notify();
      return false;
    }

    this.passwordCredentials[this.user.id] = await this.createCredential(newPassword);
    this.storageService.save('passwordCredentials', this.passwordCredentials);
    this.addAuditEntry('Changed Password', this.user.email);
    this.lastError = null;
    this.persist();
    this.notify();
    return true;
  }

  async enableTwoFactor(): Promise<string> {
    const verificationCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    this.twoFactorCredentials[this.user.id] = await this.createCredential(verificationCode);
    this.storageService.save('twoFactorCredentials', this.twoFactorCredentials);
    this.addAuditEntry('Enabled Two-Factor Authentication', this.user.email);
    this.lastError = null;
    this.persist();
    this.notify();
    return verificationCode;
  }

  disableTwoFactor(): void {
    delete this.twoFactorCredentials[this.user.id];
    this.storageService.save('twoFactorCredentials', this.twoFactorCredentials);
    this.addAuditEntry('Disabled Two-Factor Authentication', this.user.email);
    this.lastError = null;
    this.persist();
    this.notify();
  }

  hasTwoFactorEnabled(userId = this.user.id): boolean {
    return Boolean(this.twoFactorCredentials[userId]);
  }

  updateWorkspaceSettings(maxUploadSizeMb: number, allowedFileTypes: string[]): boolean {
    const normalizedTypes = [...new Set(allowedFileTypes.map((type) => type.trim().replace(/^\./, '').toUpperCase()).filter(Boolean))];
    if (!Number.isFinite(maxUploadSizeMb) || maxUploadSizeMb < 1 || maxUploadSizeMb > 1024) {
      this.lastError = 'Set a maximum upload size between 1 MB and 1024 MB.';
      this.notify();
      return false;
    }
    if (normalizedTypes.length === 0) {
      this.lastError = 'Add at least one allowed file type.';
      this.notify();
      return false;
    }

    this.workspaceSettings = { maxUploadSizeMb, allowedFileTypes: normalizedTypes };
    this.storageService.save('workspaceSettings', this.workspaceSettings);
    this.addAuditEntry('Updated Workspace Settings', 'Document policy');
    this.lastError = null;
    this.persist();
    this.notify();
    return true;
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
    this.auditLogs = [
      new AuditLog(`a${now.getTime()}`, now.toISOString(), this.user.name, 'Created Task', task.title, '127.0.0.1'),
      ...this.auditLogs,
    ];
    this.auditService.log('Created task', task.title, this.user);
    const notif = new NotificationItem(`n${now.getTime()}`, `Task created: ${task.title}`, 'Task', true, now.toISOString());
    this.notifications = [notif, ...this.notifications];
    this.persist();
    this.notify();
    return task;
  }

  completeTask(id: string): Task | null {
    const task = this.tasks.find((candidate) => candidate.id === id);
    if (!task) {
      this.lastError = 'Task not found.';
      this.notify();
      return null;
    }

    if (!this.accessService.canCompleteTask(this.user, task)) {
      this.lastError = 'You do not have permission to complete this task.';
      this.notify();
      return null;
    }

    if (task.status === 'Completed') {
      return task;
    }

    const completedTask = new Task(
      task.id,
      task.title,
      task.description,
      'Completed',
      task.priority,
      task.assignee,
      task.dueDate,
    );
    const now = new Date();
    this.tasks = this.tasks.map((candidate) => candidate.id === id ? completedTask : candidate);
    this.auditLogs = [
      new AuditLog(`a${now.getTime()}`, now.toISOString(), this.user.name, 'Completed Task', task.title, '127.0.0.1'),
      ...this.auditLogs,
    ];
    this.notifications = [
      new NotificationItem(`n${now.getTime()}`, `Task completed: ${task.title}`, 'Task', true, now.toISOString()),
      ...this.notifications,
    ];
    this.auditService.log('Completed task', task.title, this.user);
    this.lastError = null;
    this.persist();
    this.notify();
    return completedTask;
  }

  uploadDocument(input: Partial<DocumentItem> = {}): DocumentItem {
    if (!this.accessService.canUploadDocument(this.user)) {
      this.lastError = 'You do not have permission to upload documents.';
      this.notify();
      return null as any;
    }

    const type = (input.type ?? 'PDF').toUpperCase();
    if (!this.workspaceSettings.allowedFileTypes.includes(type)) {
      this.lastError = `${type} files are not allowed by the current document policy.`;
      this.notify();
      return null as any;
    }
    const size = input.size ?? '1.2 MB';
    const sizeMatch = /^\s*(\d+(?:\.\d+)?)\s*MB\s*$/i.exec(size);
    const sizeInMb = sizeMatch ? Number(sizeMatch[1]) : Number.NaN;
    if (!Number.isFinite(sizeInMb) || sizeInMb <= 0) {
      this.lastError = 'Provide a valid file size in MB.';
      this.notify();
      return null as any;
    }
    if (sizeInMb > this.workspaceSettings.maxUploadSizeMb) {
      this.lastError = `This file exceeds the ${this.workspaceSettings.maxUploadSizeMb} MB upload limit.`;
      this.notify();
      return null as any;
    }

    const now = new Date();
    const document = new DocumentItem(
      `d${now.getTime()}`,
      input.fileName ?? `new-upload-${this.documents.length + 1}.pdf`,
      type,
      `${sizeInMb} MB`,
      input.uploadedBy ?? this.user.name,
      input.uploadedAt ?? now.toISOString().slice(0, 10),
      input.linkedTask,
    );

    this.documents = [document, ...this.documents];
    this.selectedDocumentId = document.id;
    this.route = 'document-detail';
    this.auditLogs = [
      new AuditLog(`a${now.getTime() + 1}`, now.toISOString(), this.user.name, 'Uploaded Document', document.fileName, '127.0.0.1'),
      ...this.auditLogs,
    ];
    this.auditService.log('Uploaded document', document.fileName, this.user);
    const notif = new NotificationItem(`n${now.getTime() + 2}`, `${this.user.name} uploaded ${document.fileName}`, 'Document', true, now.toISOString());
    this.notifications = [notif, ...this.notifications];
    this.persist();
    this.notify();
    return document;
  }

  recordDocumentAction(id: string, action: 'Previewed Document' | 'Downloaded Document'): boolean {
    const document = this.documents.find((candidate) => candidate.id === id);
    if (!document) {
      this.lastError = 'Document not found.';
      this.notify();
      return false;
    }

    const now = new Date();
    this.auditLogs = [
      new AuditLog(`a${now.getTime()}`, now.toISOString(), this.user.name, action, document.fileName, '127.0.0.1'),
      ...this.auditLogs,
    ];
    this.auditService.log(action.toLowerCase(), document.fileName, this.user);
    this.lastError = null;
    this.persist();
    this.notify();
    return true;
  }

  deleteDocument(id: string): boolean {
    const document = this.documents.find((candidate) => candidate.id === id);
    if (!document) {
      this.lastError = 'Document not found.';
      this.notify();
      return false;
    }

    if (!this.accessService.canDeleteDocument(this.user, document)) {
      this.lastError = 'You do not have permission to delete this document.';
      this.notify();
      return false;
    }

    const now = new Date();
    this.documents = this.documents.filter((candidate) => candidate.id !== id);
    this.selectedDocumentId = this.documents[0]?.id ?? '';
    this.auditLogs = [
      new AuditLog(`a${now.getTime()}`, now.toISOString(), this.user.name, 'Deleted Document', document.fileName, '127.0.0.1'),
      ...this.auditLogs,
    ];
    this.auditService.log('Deleted document', document.fileName, this.user);
    this.notifications = [
      new NotificationItem(`n${now.getTime()}`, `Document deleted: ${document.fileName}`, 'Document', true, now.toISOString()),
      ...this.notifications,
    ];
    this.route = 'documents';
    this.lastError = null;
    this.persist();
    this.notify();
    return true;
  }

  markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((notification) => ({ ...notification, unread: false }));
    this.persist();
    this.notify();
  }

  async login(email: string, password: string, verificationCode?: string): Promise<boolean> {
    try {
      const found = this.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        this.lastError = 'Invalid credentials';
        this.notify();
        return false;
      }

      const passwordCredential = this.passwordCredentials[found.id];
      const passwordMatches = passwordCredential ? await this.credentialMatches(password, passwordCredential) : password === 'password';
      if (!passwordMatches) {
        this.lastError = 'Invalid credentials';
        this.notify();
        return false;
      }

      const twoFactorCredential = this.twoFactorCredentials[found.id];
      if (twoFactorCredential && (!verificationCode || !(await this.credentialMatches(verificationCode, twoFactorCredential)))) {
        this.lastError = 'Enter the six-digit verification code.';
        this.notify();
        return false;
      }

      this.user = found;
      this.users = this.users.some((candidate) => candidate.id === this.user.id) ? this.users : [this.user, ...this.users];
      const token = `token-${this.user.id}-${Date.now()}`;
      this.storageService.save('sessionToken', token);
      this.storageService.save('sessionUserId', this.user.id);
      this.route = 'dashboard';
      this.lastError = null;
      this.auditLogs = [
        new AuditLog(`a${Date.now()}`, new Date().toISOString(), this.user.name, 'Logged In', 'Session', '127.0.0.1'),
        ...this.auditLogs,
      ];
      this.persist();
      this.notify();
      return true;
    } catch {
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
    this.user = User.fromSeed(currentUser);
    this.notify();
  }

  persist(): void {
    this.storageService.save('tasks', this.tasks);
    this.storageService.save('documents', this.documents);
    this.storageService.save('notifications', this.notifications);
    this.storageService.save('users', this.users);
    this.storageService.save('auditLogs', this.auditLogs);
    this.storageService.save('workspaceSettings', this.workspaceSettings);
  }
}
