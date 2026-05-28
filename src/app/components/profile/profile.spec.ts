import { TestBed } from '@angular/core/testing';
import { ApiServices } from '../../services/api-services';
import { ProfileComponent } from './profile';

describe('ProfileComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', ['getProfile', 'getSession', 'forgotPassword', 'resetPassword', 'changePassword', 'extractErrorMessage'])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ProfileComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
