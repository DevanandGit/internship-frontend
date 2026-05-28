import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiServices } from '../../services/api-services';
import { InternshipsComponent } from './internships';

describe('InternshipsComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InternshipsComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { data: {} } }
                },
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', [
                        'isAdmin',
                        'isStudent',
                        'getInternships',
                        'getEligibleInternships',
                        'getAppliedInternships',
                        'applyToInternship',
                        'extractErrorMessage'
                    ])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(InternshipsComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
