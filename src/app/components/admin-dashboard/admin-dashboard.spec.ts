import { TestBed } from '@angular/core/testing';
import { ApiServices } from '../../services/api-services';
import { AdminDashboardComponent } from './admin-dashboard';

describe('AdminDashboardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', [
                        'isAdmin',
                        'getInternships',
                        'getInternshipApplications',
                        'setFeedbackTimer',
                        'approveApplication',
                        'rejectApplication',
                        'getFeedbacks',
                        'extractErrorMessage'
                    ])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AdminDashboardComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
