import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiServices } from '../../services/api-services';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoginComponent, RouterTestingModule],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', ['isAuthenticated', 'getHomeRoute', 'login', 'extractErrorMessage'])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(LoginComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
