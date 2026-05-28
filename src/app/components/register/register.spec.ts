import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiServices } from '../../services/api-services';
import { RegisterComponent } from './register';

describe('RegisterComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterComponent, RouterTestingModule],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', ['registerStudent', 'getHomeRoute', 'extractErrorMessage'])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(RegisterComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
