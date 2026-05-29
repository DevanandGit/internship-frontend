import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
    accessToken: string;
    expiresAtUtc: string;
}

export interface SessionInfo {
    token: string;
    role: string;
    userId: number;
    name: string;
    email: string;
    expiresAtUtc: string;
}

export interface StudentRegistrationRequest {
    name: string;
    email: string;
    password: string;
    collegeName: string;
    cgpa: number | null;
    backlogsCount: number | null;
    streamBranch: string;
    skillIds: number[];
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface PasswordActionResponse {
    message: string;
}

export interface StudyMaterialResponse {
    id: number;
    name: string;
    noteUrl?: string | null;
    videoUrl?: string | null;
    assignedStudents?: StudentLookupResponse[];
}

export interface StudentLookupResponse {
    id: number;
    name: string;
    email: string;
}

export interface PagedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface AppliedInternshipResponse {
    applicationId: number;
    internshipId: number;
    name: string;
    backlogsCount?: number | null;
    cgpa?: number | null;
    streamBranch?: string | null;
    stipend?: number | null;
    duration: string;
    status: string;
    appliedAtUtc: string;
}

export interface AppliedStudentResponse {
    applicationId: number;
    studentId: number;
    name: string;
    email: string;
    collegeName?: string | null;
    cgpa?: number | null;
    backlogsCount?: number | null;
    streamBranch?: string | null;
    status: string;
    appliedAtUtc: string;
}

export interface StudentProfileResponse {
    collegeName: string;
    cgpa?: number | null;
    backlogsCount?: number | null;
    streamBranch?: string | null;
    skills: string[];
    assignedStudyMaterials: StudyMaterialResponse[];
}

export interface AdminProfileResponse {
    department: string;
}

export interface UserProfileResponse {
    id: number;
    name: string;
    email: string;
    role: string;
    studentProfile?: StudentProfileResponse | null;
    adminProfile?: AdminProfileResponse | null;
    appliedInternships: AppliedInternshipResponse[];
}

export interface InternshipResponse {
    id: number;
    name: string;
    backlogsCount?: number | null;
    cgpa?: number | null;
    streamBranch?: string | null;
    stipend?: number | null;
    duration: string;
    studentsApplied?: Array<{ id?: number; name?: string; email?: string }>;
}

export interface InternshipRequest {
    name: string;
    backlogsCount: number | null;
    cgpa: number | null;
    streamBranch: string;
    stipend: number | null;
    duration: string;
    studentIds: number[];
}

export interface FeedbackTimerRequest {
    startUtc: string;
    endUtc: string;
}

export interface FeedbackTimerResponse {
    id: number;
    internshipId: number;
    startUtc: string;
    endUtc: string;
}

export interface FeedbackResponse {
    id: number;
    internshipId: number;
    internshipName?: string | null;
    studentUserId: number;
    studentName?: string | null;
    studentEmail?: string | null;
    rating: number;
    comments?: string | null;
    submittedAtUtc: string;
}

export interface CreateFeedbackRequest {
    rating: number;
    comments?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiServices {
    private readonly apiBaseUrl = '/api';
    private readonly storageKey = 'internship_portal_session';

    constructor(private readonly http: HttpClient) { }

    async login(request: LoginRequest): Promise<SessionInfo> {
        const response = await this.post<AuthResponse>('/auth/login', request, false);
        return this.storeSession(response);
    }

    async registerStudent(request: StudentRegistrationRequest): Promise<SessionInfo> {
        const response = await this.post<AuthResponse>('/auth/student/register', request, false);
        return this.storeSession(response);
    }

    async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string; resetLink?: string | null }> {
        return this.post('/auth/forgot-password', request, false);
    }

    async resetPassword(request: ResetPasswordRequest): Promise<PasswordActionResponse> {
        return this.post('/auth/reset-password', request, false);
    }

    async changePassword(request: ChangePasswordRequest): Promise<PasswordActionResponse> {
        return this.post('/auth/change-password', request, true);
    }

    async getProfile(): Promise<UserProfileResponse> {
        return this.get('/profile/me');
    }

    async getInternships(pageNumber = 1, pageSize = 10): Promise<PagedResponse<InternshipResponse>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.get('/internships', true, params);
    }

    async getEligibleInternships(pageNumber = 1, pageSize = 10): Promise<PagedResponse<InternshipResponse>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.get('/internships/eligible', true, params);
    }

    async getAppliedInternships(): Promise<AppliedInternshipResponse[]> {
        return this.get('/internships/applied');
    }

    async getStudyMaterials(): Promise<StudyMaterialResponse[]> {
        return this.get('/study-materials');
    }

    async getStudyMaterial(materialId: number): Promise<StudyMaterialResponse> {
        return this.get(`/study-materials/${materialId}`);
    }

    async createStudyMaterial(request: FormData): Promise<StudyMaterialResponse> {
        return this.postForm('/study-materials', request, true);
    }

    async updateStudyMaterial(materialId: number, request: FormData): Promise<void> {
        return this.putForm(`/study-materials/${materialId}`, request, true);
    }

    async deleteStudyMaterial(materialId: number): Promise<{ message: string }> {
        return this.delete(`/study-materials/${materialId}`, true);
    }

    async assignStudyMaterial(materialId: number, internId: number): Promise<{ message: string }> {
        return this.post(`/study-materials/${materialId}/assign/${internId}`, {}, true);
    }

    async unassignStudyMaterial(materialId: number, internId: number): Promise<void> {
        return this.delete(`/study-materials/${materialId}/assign/${internId}`, true);
    }

    async getStudents(): Promise<StudentLookupResponse[]> {
        return this.get('/students', true);
    }

    async applyToInternship(internshipId: number): Promise<{ message: string }> {
        return this.post(`/internships/${internshipId}/apply`, {}, true);
    }

    async getInternshipApplications(internshipId?: number | null): Promise<AppliedStudentResponse[]> {
        const params = internshipId ? new HttpParams().set('internshipId', internshipId.toString()) : undefined;
        return this.get('/internships/applications', true, params);
    }

    async approveApplication(applicationId: number, note: string): Promise<{ message: string; applicationId: number }> {
        return this.post(`/internships/applications/${applicationId}/approve`, { note }, true);
    }

    async rejectApplication(applicationId: number, note: string): Promise<{ message: string; applicationId: number }> {
        return this.post(`/internships/applications/${applicationId}/reject`, { note }, true);
    }

    async createInternship(request: InternshipRequest): Promise<InternshipResponse> {
        return this.post('/internships', request, true);
    }

    async updateInternship(internshipId: number, request: InternshipRequest): Promise<InternshipResponse> {
        return this.patch(`/internships/${internshipId}`, request, true);
    }

    async deleteInternship(internshipId: number): Promise<{ message: string }> {
        return this.delete(`/internships/${internshipId}`, true);
    }

    async setFeedbackTimer(internshipId: number, request: FeedbackTimerRequest): Promise<FeedbackTimerResponse> {
        return this.post(`/internships/${internshipId}/feedback/timer`, request, true);
    }

    async submitFeedback(internshipId: number, request: CreateFeedbackRequest): Promise<FeedbackResponse> {
        return this.post(`/internships/${internshipId}/feedback`, request, true);
    }

    async getFeedbacks(pageNumber = 1, pageSize = 10, internshipId?: number | null): Promise<PagedResponse<FeedbackResponse>> {
        let params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        if (internshipId !== undefined && internshipId !== null) {
            params = params.set('internshipId', internshipId.toString());
        }

        return this.get('/feedbacks', true, params);
    }

    logout(): void {
        this.getStorage()?.removeItem(this.storageKey);
    }

    getSession(): SessionInfo | null {
        const raw = this.getStorage()?.getItem(this.storageKey);
        if (!raw) {
            return null;
        }

        try {
            const session = JSON.parse(raw) as SessionInfo;
            if (session.expiresAtUtc && new Date(session.expiresAtUtc).getTime() <= Date.now()) {
                this.logout();
                return null;
            }

            return session;
        } catch {
            this.logout();
            return null;
        }
    }

    isAuthenticated(): boolean {
        return this.getSession() !== null;
    }

    isAdmin(): boolean {
        return this.getSession()?.role === 'Admin';
    }

    isStudent(): boolean {
        return this.getSession()?.role === 'Student';
    }

    getHomeRoute(): string {
        return this.isAdmin() ? '/admin/dashboard' : '/internships';
    }

    extractErrorMessage(error: unknown, fallbackMessage: string): string {
        if (typeof error === 'object' && error !== null) {
            const maybeError = error as {
                error?: { message?: string } | string;
                message?: string;
            };

            if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
                return maybeError.error;
            }

            if (maybeError.error && typeof maybeError.error === 'object' && maybeError.error.message) {
                return maybeError.error.message;
            }

            if (maybeError.message) {
                return maybeError.message;
            }
        }

        return fallbackMessage;
    }

    private async get<T>(path: string, auth = true, params?: HttpParams): Promise<T> {
        return firstValueFrom(
            this.http.get<T>(`${this.apiBaseUrl}${path}`, {
                headers: this.buildHeaders(auth),
                params
            })
        );
    }

    private async post<T>(path: string, body: unknown, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.post<T>(`${this.apiBaseUrl}${path}`, body, {
                headers: this.buildHeaders(auth)
            })
        );
    }

    private async put<T>(path: string, body: unknown, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.put<T>(`${this.apiBaseUrl}${path}`, body, {
                headers: this.buildHeaders(auth)
            })
        );
    }

    private async patch<T>(path: string, body: unknown, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.patch<T>(`${this.apiBaseUrl}${path}`, body, {
                headers: this.buildHeaders(auth)
            })
        );
    }

    private async delete<T>(path: string, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.delete<T>(`${this.apiBaseUrl}${path}`, {
                headers: this.buildHeaders(auth)
            })
        );
    }

    private buildHeaders(auth: boolean, jsonContentType = true): HttpHeaders {
        const headers: Record<string, string> = {};

        if (jsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        if (auth) {
            const session = this.getSession();
            if (session?.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
            }
        }

        return new HttpHeaders(headers);
    }

    private async postForm<T>(path: string, body: FormData, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.post<T>(`${this.apiBaseUrl}${path}`, body, {
                headers: this.buildHeaders(auth, false)
            })
        );
    }

    private async putForm<T>(path: string, body: FormData, auth = true): Promise<T> {
        return firstValueFrom(
            this.http.put<T>(`${this.apiBaseUrl}${path}`, body, {
                headers: this.buildHeaders(auth, false)
            })
        );
    }

    private storeSession(response: AuthResponse): SessionInfo {
        const payload = this.decodeToken(response.accessToken);
        const session: SessionInfo = {
            token: response.accessToken,
            role: this.readClaim(payload, [
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
                'role'
            ]) ?? 'Student',
            userId: this.readNumericClaim(payload, [
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier',
                'nameid',
                'uid'
            ]) ?? 0,
            name: this.readClaim(payload, [
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/name',
                'name'
            ]) ?? '',
            email: this.readClaim(payload, [
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress',
                'email'
            ]) ?? '',
            expiresAtUtc: response.expiresAtUtc
        };

        this.getStorage()?.setItem(this.storageKey, JSON.stringify(session));
        return session;
    }

    private decodeToken(token: string): Record<string, unknown> {
        const [, payload] = token.split('.');
        if (!payload) {
            return {};
        }

        const json = atob(this.normalizeBase64(payload));
        return JSON.parse(json) as Record<string, unknown>;
    }

    private normalizeBase64(value: string): string {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = normalized.length % 4;
        return padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    }

    private readClaim(payload: Record<string, unknown>, keys: string[]): string | null {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'string' && value.trim()) {
                return value;
            }
        }

        return null;
    }

    private readNumericClaim(payload: Record<string, unknown>, keys: string[]): number | null {
        const value = this.readClaim(payload, keys);
        if (!value) {
            return null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private getStorage(): Storage | null {
        if (typeof window === 'undefined') {
            return null;
        }

        return window.localStorage;
    }
}