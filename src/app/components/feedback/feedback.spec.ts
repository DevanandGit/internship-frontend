import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiServices } from '../../services/api-services';
import { FeedbackComponent } from './feedback';

describe('FeedbackComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeedbackComponent],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', [
                        'isAdmin',
                        'getProfile',
                        'getFeedbacks',
                        'submitFeedback',
                        'extractErrorMessage'
                    ])
                },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { data: {} } }
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FeedbackComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
